from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
import pandas as pd
import io

router = APIRouter()

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    file_url: str = Form(...)
):
    try:
        # Read file content
        contents = await file.read()
        
        # Determine file type and read accordingly
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            return JSONResponse(
                status_code=400,
                content={"detail": "Unsupported file format. Please upload CSV or Excel files."}
            )
        
        # Get file info
        headers = df.columns.tolist()
        rows = len(df)
        columns = len(df.columns)
        
        # Get sample data (first 5 rows)
        sample_data = df.head(5).to_dict(orient='records')
        
        return {
            "success": True,
            "file_name": file.filename,
            "headers": headers,
            "rows": rows,
            "columns": columns,
            "sample_data": sample_data,
            "file_url": file_url
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": f"Failed to process file: {str(e)}"}
        )
