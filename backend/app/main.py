from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Header, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import io
import json
import re
from typing import Optional, List
import os
from datetime import datetime
from dotenv import load_dotenv
import httpx

# Load environment variables from .env file
load_dotenv()

from app.services.ai_service import call_ai_for_query, repair_generated_code
from app.api.routes import user

app = FastAPI(title="Excel Killer API - Production")

# Include routers
app.include_router(user.router, prefix="/api/user", tags=["user"])

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for uploaded files and queries (fallback)
files_storage = {}
queries_history = []  # Store query history
users_cache = {}  # Cache users to avoid repeated API calls

# Supabase REST API configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
USE_SUPABASE = bool(SUPABASE_URL and SUPABASE_KEY)

# Global httpx client for better performance
http_client: Optional[httpx.AsyncClient] = None

if USE_SUPABASE:
    SUPABASE_REST_URL = f"{SUPABASE_URL}/rest/v1"
    SUPABASE_HEADERS = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    print(f"✅ Supabase configured: {SUPABASE_REST_URL}")
else:
    SUPABASE_REST_URL = ""
    SUPABASE_HEADERS = {}
    print("⚠️ Supabase disabled - using in-memory storage")

# Supabase Storage configuration
SUPABASE_STORAGE_BUCKET = "user-files"
SUPABASE_STORAGE_URL = f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_STORAGE_BUCKET}" if SUPABASE_URL else ""
SUPABASE_STORAGE_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
} if SUPABASE_KEY else {}


@app.on_event("startup")
async def startup():
    global http_client
    http_client = httpx.AsyncClient(timeout=30.0)
    print("✅ HTTP client initialized")


@app.on_event("shutdown")
async def shutdown():
    global http_client
    if http_client:
        await http_client.aclose()


async def upload_to_storage(file_id: str, user_id: str, filename: str, contents: bytes) -> Optional[str]:
    """Upload file bytes to Supabase Storage. Returns the storage path or None on failure."""
    if not USE_SUPABASE or not http_client:
        return None
    try:
        content_type = "text/csv" if filename.endswith(".csv") else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        storage_path = f"{user_id}/{file_id}/{filename}"
        headers = {**SUPABASE_STORAGE_HEADERS, "Content-Type": content_type, "x-upsert": "true"}
        response = await http_client.post(
            f"{SUPABASE_STORAGE_URL}/{storage_path}",
            headers=headers,
            content=contents
        )
        if response.status_code in [200, 201]:
            print(f"✅ Uploaded {filename} to Supabase Storage at {storage_path}")
            return storage_path
        else:
            print(f"⚠️ Storage upload failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"⚠️ Storage upload error: {e}")
        return None


async def load_file_into_memory(file_id: str) -> bool:
    """Fetch a file from Supabase Storage and load it into files_storage. Returns True on success."""
    if not USE_SUPABASE or not http_client:
        return False
    try:
        # Get file metadata from Supabase
        response = await http_client.get(
            f"{SUPABASE_REST_URL}/files?id=eq.{file_id}&select=*",
            headers=SUPABASE_HEADERS
        )
        if response.status_code != 200 or not response.json():
            print(f"⚠️ File {file_id} not found in Supabase DB")
            return False

        file_meta = response.json()[0]
        storage_path = file_meta.get("file_url")
        filename = file_meta.get("filename", "")

        if not storage_path:
            print(f"⚠️ No storage path for file {file_id}")
            return False

        # Download file from Supabase Storage
        dl_response = await http_client.get(
            f"{SUPABASE_STORAGE_URL}/{storage_path}",
            headers=SUPABASE_STORAGE_HEADERS
        )
        if dl_response.status_code != 200:
            print(f"⚠️ Storage download failed: {dl_response.status_code}")
            return False

        contents = dl_response.content
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            print(f"⚠️ Unknown file type for {filename}")
            return False

        files_storage[file_id] = {
            "filename": filename,
            "dataframe": df,
            "headers": df.columns.tolist(),
            "shape": df.shape,
            "dtypes": df.dtypes.astype(str).to_dict(),
            "user_id": file_meta.get("user_id"),
            "file_url": storage_path,
            "created_at": file_meta.get("created_at", datetime.utcnow().isoformat())
        }
        print(f"✅ Loaded file {file_id} from Supabase Storage into memory")
        return True
    except Exception as e:
        print(f"⚠️ Failed to load file from storage: {e}")
        return False


async def get_or_create_user(clerk_user_id: str, email: str = None, name: str = None):
    """Get or create user in Supabase - with caching"""
    # Check cache first
    if clerk_user_id in users_cache:
        return users_cache[clerk_user_id]
    
    if not USE_SUPABASE or not http_client:
        return {"id": clerk_user_id, "clerk_user_id": clerk_user_id}
    
    try:
        # Check if user exists in Supabase
        response = await http_client.get(
            f"{SUPABASE_REST_URL}/users?clerk_user_id=eq.{clerk_user_id}&select=*",
            headers=SUPABASE_HEADERS
        )
        
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                users_cache[clerk_user_id] = data[0]
                return data[0]
        
        # User doesn't exist, create new one
        if not email:
            email = f"{clerk_user_id}@clerk.user"
        
        new_user = {
            "clerk_user_id": clerk_user_id,
            "email": email,
            "name": name or "User"
        }
        
        response = await http_client.post(
            f"{SUPABASE_REST_URL}/users",
            headers=SUPABASE_HEADERS,
            json=new_user
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            if data and len(data) > 0:
                users_cache[clerk_user_id] = data[0]
                print(f"✅ Created new user: {clerk_user_id}")
                return data[0]
        
        # Fallback if creation fails
        print(f"⚠️ Failed to create user: {response.status_code} - {response.text}")
        return {"id": clerk_user_id, "clerk_user_id": clerk_user_id}
        
    except Exception as e:
        print(f"⚠️ Error with user: {e}")
        return {"id": clerk_user_id, "clerk_user_id": clerk_user_id}


# Usage limits for free tier
FREE_TIER_LIMITS = {
    "uploads": 10,
    "queries": 50
}


async def check_usage_limit(user_id: str, limit_type: str) -> dict:
    """Check if user has exceeded their daily limit. Returns {"allowed": bool, "current": int, "limit": int, "is_pro": bool}"""
    from datetime import datetime, timezone
    
    if not user_id:
        return {"allowed": True, "current": 0, "limit": FREE_TIER_LIMITS.get(limit_type, 999), "is_pro": False}
    
    limit = FREE_TIER_LIMITS.get(limit_type, 999)
    current = 0
    is_pro = False
    
    if USE_SUPABASE and http_client:
        try:
            db_user = await get_or_create_user(user_id)
            
            if db_user and "id" in db_user:
                db_user_id = db_user['id']
                
                # Check if user is Pro (unlimited)
                is_pro = db_user.get("plan") == "pro" and db_user.get("subscription_status") == "active"
                if is_pro:
                    return {"allowed": True, "current": 0, "limit": 999999, "is_pro": True}
                
                today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
                today_iso = today_start.strftime("%Y-%m-%dT%H:%M:%SZ")
                
                table = "files" if limit_type == "uploads" else "queries"
                response = await http_client.get(
                    f"{SUPABASE_REST_URL}/{table}?user_id=eq.{db_user_id}&created_at=gte.{today_iso}&select=id",
                    headers=SUPABASE_HEADERS
                )
                if response.status_code == 200:
                    current = len(response.json())
        except Exception as e:
            print(f"⚠️ Failed to check usage limit: {e}")
    
    return {
        "allowed": current < limit,
        "current": current,
        "limit": limit,
        "is_pro": is_pro
    }


class QueryRequest(BaseModel):
    file_id: str
    query: str
    user_id: Optional[str] = None
    chat_history: Optional[List[dict]] = []


class QueryResponse(BaseModel):
    answer: str
    data: Optional[List[dict]] = None
    chart_type: Optional[str] = None
    generated_code: Optional[str] = None


# Verify Clerk JWT (optional - for production)
async def verify_user(authorization: str = Header(None)):
    """Verify Clerk JWT token"""
    # In production, verify the JWT from Clerk
    # For now, we'll skip verification
    return True


@app.get("/")
def root():
    return {
        "message": "Excel Killer API is running!",
        "version": "2.0.0",
        "status": "production-ready"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "llm": bool(os.getenv("GROK_API_KEY") or os.getenv("OPENAI_API_KEY")),
            "supabase": bool(os.getenv("SUPABASE_URL")),
        }
    }


def looks_like_multi_question_prompt(query: str) -> bool:
    stripped = query.strip()
    if not stripped:
        return False

    numbered_lines = re.findall(r"(?m)^\s*\d+[\.)]\s+", stripped)
    question_marks = stripped.count("?")
    bullet_lines = re.findall(r"(?m)^\s*[-*]\s+", stripped)

    return len(numbered_lines) >= 2 or question_marks >= 2 or (len(bullet_lines) >= 2 and "\n" in stripped)


@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    user_id: Optional[str] = Form(None),
    file_url: Optional[str] = Form(None)
):
    """Upload and process CSV/Excel file"""
    print(f"📤 Upload request - user_id: {user_id}, filename: {file.filename}")
    
    # Check usage limit
    usage = await check_usage_limit(user_id, "uploads")
    if not usage["allowed"]:
        raise HTTPException(
            status_code=429, 
            detail=f"Daily upload limit reached ({usage['current']}/{usage['limit']}). Upgrade to Pro for unlimited uploads."
        )
    
    try:
        # Read file
        contents = await file.read()
        
        # Detect file type and parse
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Use CSV or Excel.")
        
        # Validate dataframe
        if df.empty:
            raise HTTPException(status_code=400, detail="File is empty")

        # Upload to Supabase Storage first (so we have a persistent URL)
        storage_path = None
        if USE_SUPABASE and user_id:
            temp_file_id = f"file_{len(files_storage) + 1}_{datetime.utcnow().timestamp()}"
            storage_path = await upload_to_storage(temp_file_id, user_id, file.filename, contents)

        # Generate file ID
        file_id = temp_file_id if USE_SUPABASE and user_id else f"file_{len(files_storage) + 1}_{datetime.utcnow().timestamp()}"
        
        # Store file data in memory (always for performance)
        files_storage[file_id] = {
            "filename": file.filename,
            "dataframe": df,
            "headers": df.columns.tolist(),
            "shape": df.shape,
            "dtypes": df.dtypes.astype(str).to_dict(),
            "user_id": user_id,
            "file_url": storage_path or file_url,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Save metadata to Supabase if available
        if USE_SUPABASE and user_id and http_client:
            try:
                # Get or create user
                db_user = await get_or_create_user(user_id)
                print(f"📝 Saving file for user: {db_user}")
                
                # Only save if we got a valid user
                if db_user and "id" in db_user:
                    # Save file metadata
                    file_record = {
                        "id": file_id,
                        "user_id": db_user["id"],
                        "filename": file.filename,
                        "rows": int(df.shape[0]),
                        "columns": int(df.shape[1]),
                        "file_url": storage_path or file_url,
                        "headers": df.columns.tolist(),
                        "dtypes": df.dtypes.astype(str).to_dict()
                    }
                    
                    response = await http_client.post(
                        f"{SUPABASE_REST_URL}/files",
                        headers=SUPABASE_HEADERS,
                        json=file_record
                    )
                    if response.status_code in [200, 201]:
                        print(f"✅ Saved file {file_id} to Supabase")
                    else:
                        print(f"⚠️ Failed to save file: {response.status_code} - {response.text}")
                else:
                    print(f"⚠️ No valid user found: {db_user}")
            except Exception as e:
                print(f"⚠️ Failed to save to Supabase: {e}")
        else:
            print(f"⚠️ Skipping Supabase save: USE_SUPABASE={USE_SUPABASE}, user_id={user_id}, http_client={http_client is not None}")
        
        # Convert NaN to None for JSON serialization
        preview_df = df.head(10).fillna('')
        
        return {
            "file_id": file_id,
            "filename": file.filename,
            "headers": df.columns.tolist(),
            "rows": len(df),
            "columns": len(df.columns),
            "preview": preview_df.to_dict('records'),
            "dtypes": df.dtypes.astype(str).to_dict()
        }
    
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="File is empty or corrupted")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@app.post("/api/query", response_model=QueryResponse)
async def query_data(request: QueryRequest):
    """Process natural language query and return analysis"""

    if looks_like_multi_question_prompt(request.query):
        raise HTTPException(
            status_code=400,
            detail="Ask one analysis question at a time. Numbered lists or multiple questions in one message are not supported yet."
        )
    
    # Check usage limit
    usage = await check_usage_limit(request.user_id, "queries")
    if not usage["allowed"]:
        raise HTTPException(
            status_code=429, 
            detail=f"Daily query limit reached ({usage['current']}/{usage['limit']}). Upgrade to Pro for unlimited queries."
        )
    
    try:
        # Validate file exists - try to reload from Supabase Storage if not in memory
        if request.file_id not in files_storage:
            loaded = await load_file_into_memory(request.file_id)
            if not loaded:
                raise HTTPException(status_code=404, detail="File not found. Please upload again.")
        
        file_data = files_storage[request.file_id]
        df = file_data["dataframe"].copy()

        # Auto-convert date-like columns to datetime with mixed-format support.
        # This handles values like: 2024-01-01, 02/01/2024, 2024/01/03.
        for col in df.columns:
            if df[col].dtype == "object":
                try:
                    col_as_str = df[col].astype(str).str.strip()
                    non_empty = col_as_str.ne("") & col_as_str.ne("nan")

                    # First pass: standard mixed parsing
                    parsed = pd.to_datetime(col_as_str.where(non_empty), errors="coerce", format="mixed")

                    # Second pass for unresolved values: try day-first parsing
                    unresolved_mask = parsed.isna() & non_empty
                    if unresolved_mask.any():
                        reparsed = pd.to_datetime(
                            col_as_str[unresolved_mask],
                            errors="coerce",
                            format="mixed",
                            dayfirst=True,
                        )
                        parsed.loc[unresolved_mask] = reparsed

                    if parsed.notna().sum() > len(df) * 0.5:
                        df[col] = parsed
                        print(f"📅 Auto-converted column '{col}' to datetime (mixed format)")
                except Exception:
                    pass

        # Keep prompt metadata aligned with the preprocessed dataframe.
        file_data_for_prompt = {
            **file_data,
            "dtypes": df.dtypes.astype(str).to_dict(),
            "shape": df.shape,
        }

        # Call LLM (Grok/OpenAI via ai_service)
        try:
            ai_response = call_ai_for_query(df, file_data_for_prompt, request.query)
        except Exception as ai_error:
            raise HTTPException(status_code=500, detail=f"AI service error: {str(ai_error)}")
        generated_code = ai_response.get("code", "")
        chart_type = ai_response.get("chart_type", "table")
        explanation = ai_response.get("explanation", "Analysis complete.")
        
        def execute_analysis_code(code_to_run: str):
            # Create safe execution environment with necessary builtins
            safe_builtins = {
                'len': len,
                'range': range,
                'enumerate': enumerate,
                'zip': zip,
                'map': map,
                'filter': filter,
                'sorted': sorted,
                'reversed': reversed,
                'sum': sum,
                'min': min,
                'max': max,
                'abs': abs,
                'round': round,
                'int': int,
                'float': float,
                'str': str,
                'bool': bool,
                'list': list,
                'dict': dict,
                'tuple': tuple,
                'set': set,
                'print': print,
                'isinstance': isinstance,
                'type': type,
                'hasattr': hasattr,
                'getattr': getattr,
                'None': None,
                'True': True,
                'False': False,
            }
            
            # Import datetime for date operations
            from datetime import datetime as dt, timedelta
            import numpy as np
            
            local_vars = {
                "df": df.copy(), 
                "pd": pd,
                "np": np,
                "datetime": dt,
                "timedelta": timedelta,
            }
            
            # Log the generated code for debugging
            print(f"🐍 Generated code:\n{code_to_run}")
            
            # Execute the code
            exec(code_to_run, {"__builtins__": safe_builtins, "pd": pd, "np": np, "datetime": dt, "timedelta": timedelta}, local_vars)
            
            # Get result
            if "result" in local_vars:
                return local_vars["result"]
            else:
                raise RuntimeError("The AI did not assign a value to result")

        def serialize_result(result_obj):
            if isinstance(result_obj, pd.DataFrame):
                result_df = result_obj.copy()

                # If analysis returns a meaningful index (e.g. monthly PeriodIndex),
                # move it into an explicit first column so charts get a stable X-axis.
                if not isinstance(result_df.index, pd.RangeIndex):
                    index_name = result_df.index.name or "Time"
                    result_df = result_df.reset_index()
                    if "index" in result_df.columns and index_name != "index":
                        result_df = result_df.rename(columns={"index": index_name})

                # Remove obvious artificial/helper columns
                cols_to_drop = []
                for col in result_df.columns:
                    col_lower = col.lower()
                    # Drop synthetic column names
                    if col_lower in ['time', 'temp', 'helper', 'row_num', 'extract']:
                        cols_to_drop.append(col)
                
                if cols_to_drop:
                    result_df = result_df.drop(columns=cols_to_drop)

                # Auto-pivot long format to wide format for multi-series charts
                # Detect: if 3 columns (time-like + category + numeric), pivot it
                if len(result_df.columns) == 3:
                    cols = result_df.columns.tolist()
                    
                    # Try to identify: which is time-like, which is category, which is numeric
                    time_col = None
                    category_col = None
                    value_col = None
                    
                    for col in cols:
                        col_lower = col.lower()
                        if any(t in col_lower for t in ['month', 'date', 'year', 'time', 'period']):
                            time_col = col
                        elif pd.api.types.is_numeric_dtype(result_df[col]):
                            value_col = col
                        else:
                            category_col = col
                    
                    # If we found all three, pivot
                    if time_col and category_col and value_col:
                        result_df = result_df.pivot_table(
                            index=time_col,
                            columns=category_col,
                            values=value_col,
                            aggfunc='first'
                        ).reset_index()

                # Ensure time-like columns are JSON-friendly and readable in the frontend.
                for col in result_df.columns:
                    if pd.api.types.is_datetime64_any_dtype(result_df[col]):
                        result_df[col] = result_df[col].dt.strftime("%Y-%m-%d")
                    elif pd.api.types.is_period_dtype(result_df[col]):
                        result_df[col] = result_df[col].astype(str)

                return result_df.to_dict('records')

            if isinstance(result_obj, pd.Series):
                return [{"name": str(k), "value": float(v) if pd.api.types.is_numeric_dtype(type(v)) else v}
                        for k, v in result_obj.items()]

            if isinstance(result_obj, (int, float)):
                return [{"value": float(result_obj)}]

            if isinstance(result_obj, dict):
                return [result_obj]

            return [{"value": str(result_obj)}]

        # Execute code safely
        result_data = None
        try:
            result = execute_analysis_code(generated_code)
            result_data = serialize_result(result)
            
            # Limit data size for frontend
            if len(result_data) > 100:
                result_data = result_data[:100]
        
        except Exception as exec_error:
            error_msg = str(exec_error)
            try:
                repaired_response = repair_generated_code(
                    df=df,
                    file_data=file_data_for_prompt,
                    user_query=request.query,
                    broken_code=generated_code,
                    error_message=error_msg,
                )
                generated_code = repaired_response.get("code", generated_code)
                chart_type = repaired_response.get("chart_type", chart_type)
                explanation = repaired_response.get("explanation", explanation)
                result = execute_analysis_code(generated_code)
                result_data = serialize_result(result)

                if len(result_data) > 100:
                    result_data = result_data[:100]
            except Exception as repair_error:
                raise HTTPException(
                    status_code=500,
                    detail=f"Code execution failed: {error_msg}. Retry also failed: {repair_error}."
                )
        
        # Save query to history
        query_id = f"query_{len(queries_history) + 1}_{datetime.utcnow().timestamp()}"
        query_record = {
            "id": query_id,
            "file_id": request.file_id,
            "filename": file_data["filename"],
            "query": request.query,
            "answer": explanation,
            "chart_type": chart_type,
            "user_id": request.user_id,
            "created_at": datetime.utcnow().isoformat()
        }
        queries_history.append(query_record)
        
        # Save to Supabase if available
        if USE_SUPABASE and request.user_id and http_client:
            try:
                db_user = await get_or_create_user(request.user_id)
                
                # Only save if we got a valid user
                if db_user and "id" in db_user:
                    # First check if the file exists in Supabase
                    file_check = await http_client.get(
                        f"{SUPABASE_REST_URL}/files?id=eq.{request.file_id}&select=id",
                        headers=SUPABASE_HEADERS
                    )
                    file_exists_in_db = file_check.status_code == 200 and len(file_check.json()) > 0
                    
                    # If file doesn't exist in Supabase, save it first
                    if not file_exists_in_db:
                        file_data_to_save = files_storage.get(request.file_id, {})
                        file_record = {
                            "id": request.file_id,
                            "user_id": db_user["id"],
                            "filename": file_data_to_save.get("filename", "unknown"),
                            "rows": int(file_data_to_save.get("shape", (0, 0))[0]),
                            "columns": int(file_data_to_save.get("shape", (0, 0))[1]),
                            "file_url": file_data_to_save.get("file_url"),
                            "headers": file_data_to_save.get("headers", []),
                            "dtypes": file_data_to_save.get("dtypes", {})
                        }
                        
                        file_response = await http_client.post(
                            f"{SUPABASE_REST_URL}/files",
                            headers=SUPABASE_HEADERS,
                            json=file_record
                        )
                        if file_response.status_code in [200, 201]:
                            print(f"✅ Auto-saved file {request.file_id} to Supabase before query")
                        else:
                            print(f"⚠️ Could not save file before query: {file_response.text}")
                    
                    # Now save the query
                    supabase_query = {
                        "id": query_id,
                        "user_id": db_user["id"],
                        "file_id": request.file_id,
                        "query": request.query,
                        "answer": explanation,
                        "chart_type": chart_type,
                        "generated_code": generated_code
                    }
                    
                    response = await http_client.post(
                        f"{SUPABASE_REST_URL}/queries",
                        headers=SUPABASE_HEADERS,
                        json=supabase_query
                    )
                    if response.status_code in [200, 201]:
                        print(f"✅ Saved query {query_id} to Supabase")
                    else:
                        print(f"⚠️ Failed to save query: {response.text}")
            except Exception as e:
                print(f"⚠️ Failed to save query to Supabase: {e}")
        
        return QueryResponse(
            answer=explanation,
            data=result_data,
            chart_type=chart_type,
            generated_code=generated_code
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Query processing error: {str(e)}"
        )


@app.get("/api/files/{file_id}/preview")
async def get_file_preview(file_id: str, rows: int = 100):
    """Get preview of uploaded file"""
    if file_id not in files_storage:
        loaded = await load_file_into_memory(file_id)
        if not loaded:
            raise HTTPException(status_code=404, detail="File not found")
    
    df = files_storage[file_id]["dataframe"]
    return {
        "data": df.head(rows).to_dict('records'),
        "total_rows": len(df),
        "headers": files_storage[file_id]["headers"]
    }


@app.get("/api/files/{file_id}/stats")
async def get_file_stats(file_id: str):
    """Get statistical summary of file"""
    if file_id not in files_storage:
        loaded = await load_file_into_memory(file_id)
        if not loaded:
            raise HTTPException(status_code=404, detail="File not found")
    
    df = files_storage[file_id]["dataframe"]
    
    # Get numeric columns statistics
    numeric_stats = df.describe().to_dict()
    
    # Get column info
    column_info = []
    for col in df.columns:
        col_info = {
            "name": col,
            "dtype": str(df[col].dtype),
            "null_count": int(df[col].isnull().sum()),
            "unique_count": int(df[col].nunique())
        }
        
        if pd.api.types.is_numeric_dtype(df[col]):
            col_info["min"] = float(df[col].min())
            col_info["max"] = float(df[col].max())
            col_info["mean"] = float(df[col].mean())
        
        column_info.append(col_info)
    
    return {
        "shape": files_storage[file_id]["shape"],
        "numeric_stats": numeric_stats,
        "columns": column_info
    }


@app.delete("/api/files/{file_id}")
async def delete_file(file_id: str, user_id: Optional[str] = None):
    """Soft delete uploaded file (marks as deleted but keeps data)"""
    
    # Soft delete from Supabase (set deleted_at timestamp)
    if USE_SUPABASE and http_client:
        try:
            from datetime import datetime
            deleted_at = datetime.utcnow().isoformat()
            
            # Soft delete the file (update deleted_at)
            update_response = await http_client.patch(
                f"{SUPABASE_URL}/rest/v1/files?id=eq.{file_id}",
                headers=SUPABASE_HEADERS,
                json={"deleted_at": deleted_at}
            )
            print(f"✅ Soft deleted file {file_id} from Supabase: {update_response.status_code}")
            
            # Also soft delete related queries
            await http_client.patch(
                f"{SUPABASE_URL}/rest/v1/queries?file_id=eq.{file_id}",
                headers=SUPABASE_HEADERS,
                json={"deleted_at": deleted_at}
            )
            print(f"🗑️ Soft deleted queries for file {file_id}")
        except Exception as e:
            print(f"⚠️ Failed to soft delete from Supabase: {e}")
    
    # Delete from in-memory storage
    if file_id in files_storage:
        del files_storage[file_id]
    
    # Delete related queries from in-memory
    global queries_history
    queries_history = [q for q in queries_history if q.get("file_id") != file_id]
    
    return {"message": "File deleted successfully"}


@app.get("/api/files")
async def list_files(user_id: Optional[str] = None):
    """Get list of all uploaded files (optionally filtered by user, excludes soft-deleted)"""
    
    # Try to get from Supabase first
    if USE_SUPABASE and user_id and http_client:
        try:
            db_user = await get_or_create_user(user_id)
            
            if db_user and "id" in db_user:
                # Filter out soft-deleted files (deleted_at is null)
                response = await http_client.get(
                    f"{SUPABASE_REST_URL}/files?user_id=eq.{db_user['id']}&deleted_at=is.null&order=created_at.desc",
                    headers=SUPABASE_HEADERS
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data:
                        normalized_files = []
                        for file in data:
                            normalized_files.append({
                                "id": file.get("id"),
                                "filename": file.get("filename"),
                                "rows": file.get("rows", 0),
                                "columns": file.get("columns", 0),
                                "created_at": file.get("created_at"),
                                "user_id": file.get("user_id")
                            })
                        return {"files": normalized_files}
                    return {"files": []}
        except Exception as e:
            print(f"⚠️ Failed to fetch from Supabase: {e}")
    
    # Fallback to in-memory storage
    files_list = []
    for file_id, file_data in files_storage.items():
        if user_id and file_data.get("user_id") != user_id:
            continue
        
        files_list.append({
            "id": file_id,
            "filename": file_data["filename"],
            "rows": file_data["shape"][0],
            "columns": file_data["shape"][1],
            "created_at": file_data["created_at"],
            "user_id": file_data.get("user_id")
        })
    
    # Sort by created_at descending
    files_list.sort(key=lambda x: x["created_at"], reverse=True)
    return {"files": files_list}


@app.get("/api/history")
async def get_query_history(user_id: Optional[str] = None, limit: int = 100):
    """Get query history (optionally filtered by user, excludes soft-deleted)"""
    
    # Try to get from Supabase first
    if USE_SUPABASE and user_id and http_client:
        try:
            db_user = await get_or_create_user(user_id)
            
            if db_user and "id" in db_user:
                # Filter out soft-deleted queries (deleted_at is null)
                response = await http_client.get(
                    f"{SUPABASE_REST_URL}/queries?user_id=eq.{db_user['id']}&deleted_at=is.null&order=created_at.desc&limit={limit}",
                    headers=SUPABASE_HEADERS
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {"queries": data if data else []}
        except Exception as e:
            print(f"⚠️ Failed to fetch from Supabase: {e}")
    
    # Fallback to in-memory storage
    filtered_queries = queries_history
    
    if user_id:
        filtered_queries = [q for q in queries_history if q.get("user_id") == user_id]
    
    # Sort by created_at descending and limit
    sorted_queries = sorted(filtered_queries, key=lambda x: x["created_at"], reverse=True)
    return {"queries": sorted_queries[:limit]}


@app.get("/api/usage")
async def get_usage_stats(user_id: str):
    """Get today's usage stats for a user (counts ALL uploads/queries, including deleted)"""
    from datetime import datetime, timezone
    from urllib.parse import quote
    
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    # Format: 2025-12-17T00:00:00Z (URL-safe)
    today_iso = today_start.strftime("%Y-%m-%dT%H:%M:%SZ")
    
    uploads_today = 0
    queries_today = 0
    is_pro = False
    
    print(f"📊 Usage check for user_id: {user_id}, today_start: {today_iso}")
    
    if USE_SUPABASE and http_client:
        try:
            db_user = await get_or_create_user(user_id)
            print(f"📊 DB user found: {db_user.get('id') if db_user else 'None'}")
            
            if db_user and "id" in db_user:
                db_user_id = db_user['id']
                
                # Check if user is Pro
                is_pro = db_user.get("plan") == "pro" and db_user.get("subscription_status") == "active"
                
                # Count ALL files uploaded today (including deleted - for fair usage tracking)
                files_url = f"{SUPABASE_REST_URL}/files?user_id=eq.{db_user_id}&created_at=gte.{today_iso}&select=id"
                print(f"📊 Files URL: {files_url}")
                files_response = await http_client.get(files_url, headers=SUPABASE_HEADERS)
                print(f"📊 Files response: {files_response.status_code} - {files_response.text[:200]}")
                if files_response.status_code == 200:
                    uploads_today = len(files_response.json())
                
                # Count ALL queries made today (including deleted)
                queries_url = f"{SUPABASE_REST_URL}/queries?user_id=eq.{db_user_id}&created_at=gte.{today_iso}&select=id"
                queries_response = await http_client.get(queries_url, headers=SUPABASE_HEADERS)
                print(f"📊 Queries response: {queries_response.status_code} - {queries_response.text[:200]}")
                if queries_response.status_code == 200:
                    queries_today = len(queries_response.json())
                
                print(f"📊 Result: uploads={uploads_today}, queries={queries_today}, is_pro={is_pro}")
                    
        except Exception as e:
            print(f"⚠️ Failed to get usage stats: {e}")
            import traceback
            traceback.print_exc()
    
    return {
        "uploads_today": uploads_today,
        "queries_today": queries_today,
        "is_pro": is_pro,
        "limits": {
            "uploads": 999999 if is_pro else 10,
            "queries": 999999 if is_pro else 50
        }
    }


@app.get("/api/user/{clerk_user_id}")
async def get_user(clerk_user_id: str):
    """Get user details including subscription status - always fetch fresh"""
    if USE_SUPABASE and http_client:
        try:
            # Always fetch fresh from Supabase (don't use cache for this endpoint)
            url = f"{SUPABASE_REST_URL}/users?clerk_user_id=eq.{clerk_user_id}&select=id,clerk_user_id,email,name,plan,subscription_status,stripe_customer_id,stripe_subscription_id,created_at,updated_at"
            response = await http_client.get(url, headers=SUPABASE_HEADERS)
            print(f"🔍 Get user URL: {url}")
            print(f"🔍 Get user response: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"🔍 Get user data: {data}")
                if data:
                    return data[0]
        except Exception as e:
            print(f"⚠️ Failed to get user: {e}")
    
    return {"clerk_user_id": clerk_user_id, "plan": "free"}


@app.post("/api/user/{clerk_user_id}/subscription")
async def update_subscription(clerk_user_id: str, data: dict):
    """Update user subscription status (called by Stripe webhook)"""
    print(f"💳 Updating subscription for {clerk_user_id}: {data}")
    
    # Clear cache for this user so fresh data is fetched
    if clerk_user_id in users_cache:
        del users_cache[clerk_user_id]
    
    if USE_SUPABASE and http_client:
        try:
            # First get the user (will re-fetch since we cleared cache)
            db_user = await get_or_create_user(clerk_user_id)
            
            if db_user and "id" in db_user:
                # Build update data
                update_data = {}
                if "stripe_customer_id" in data:
                    update_data["stripe_customer_id"] = data["stripe_customer_id"]
                if "stripe_subscription_id" in data:
                    update_data["stripe_subscription_id"] = data["stripe_subscription_id"]
                if "plan" in data:
                    update_data["plan"] = data["plan"]
                if "status" in data:
                    update_data["subscription_status"] = data["status"]
                
                if update_data:
                    response = await http_client.patch(
                        f"{SUPABASE_REST_URL}/users?id=eq.{db_user['id']}",
                        headers=SUPABASE_HEADERS,
                        json=update_data
                    )
                    if response.status_code in [200, 204]:
                        # Clear cache again so next request gets updated data
                        if clerk_user_id in users_cache:
                            del users_cache[clerk_user_id]
                        print(f"✅ Subscription updated for {clerk_user_id}")
                        return {"success": True}
                    else:
                        print(f"⚠️ Failed to update subscription: {response.text}")
        except Exception as e:
            print(f"⚠️ Failed to update subscription: {e}")
    
    return {"success": False}


@app.post("/api/cache/clear")
async def clear_cache():
    """Clear all user cache - useful for debugging"""
    users_cache.clear()
    return {"success": True, "message": "Cache cleared"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)