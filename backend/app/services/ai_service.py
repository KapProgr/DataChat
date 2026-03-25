import json
from typing import Any, Dict, List

import pandas as pd
from openai import OpenAI

from app.core.config import get_settings

settings = get_settings()


def get_ai_client() -> OpenAI:
    """
    Returns an OpenAI-compatible client.
    You can point this to Grok (xAI) by setting GROK_API_KEY / GROK_API_BASE_URL,
    or fall back to OPENAI_API_KEY.
    """
    if settings.GROK_API_KEY:
        api_key = settings.GROK_API_KEY
        base_url = settings.GROK_API_BASE_URL or None
    elif settings.OPENAI_API_KEY:
        api_key = settings.OPENAI_API_KEY
        base_url = None
    else:
        api_key = None
        base_url = None

    if not api_key:
        raise RuntimeError("No LLM API key configured (GROK_API_KEY / OPENAI_API_KEY)")

    try:
        client_kwargs = {
            "api_key": api_key,
        }
        if base_url:
            client_kwargs["base_url"] = base_url
        
        return OpenAI(**client_kwargs)
    except Exception as e:
        raise RuntimeError(f"Failed to initialize AI client: {str(e)}")


def build_analysis_prompt(file_data: Dict[str, Any], df: pd.DataFrame) -> str:
    # Get sample data and convert any non-serializable types to strings
    sample_row = df.head(1).to_dict('records')[0] if len(df) > 0 else {}
    # Convert timestamps and other non-serializable types to strings
    for key, value in sample_row.items():
        if pd.isna(value):
            sample_row[key] = None
        elif hasattr(value, 'isoformat'):  # datetime-like
            sample_row[key] = str(value)
        elif not isinstance(value, (str, int, float, bool, type(None))):
            sample_row[key] = str(value)
    
    return f"""You are an expert data analyst. You have access to a dataset with these columns:
{json.dumps(file_data['headers'], indent=2)}

Dataset info:
- Shape: {file_data['shape'][0]} rows, {file_data['shape'][1]} columns
- Column types: {json.dumps(file_data['dtypes'], indent=2)}
- Sample data (first row): {json.dumps(sample_row, indent=2)}

Your task:
1. Analyze the user's question carefully
2. Generate Python pandas code to answer it
3. The code should assign the result to a variable called 'result'
4. Determine the best visualization type: bar, line, pie, scatter, table, or none
5. Return ONLY valid JSON with this exact structure:
{{
  "code": "# Python code using 'df' variable\\nresult = df.groupby('column').sum()",
  "explanation": "Brief explanation of the analysis",
  "chart_type": "bar"
}}

Rules:
- Use only pandas operations on the 'df' DataFrame
- You have access to: df, pd (pandas), np (numpy), datetime, timedelta
- Always assign final result to 'result' variable
- The user message must represent exactly one analysis request. If the user asks multiple numbered questions, answer only the first analytical request and ignore the rest.
- NEVER use import or from ... import statements under any circumstance
- ONLY return columns that directly answer the user's question. Do NOT create synthetic/extracted columns
- Example: If asked "top 10 orders by profit", return only [Order ID, Profit] — do NOT add extracted numeric columns
- For date/time grouping by month, use: df['Date'].dt.to_period('M').astype(str) or df['Date'].dt.month_name()
- For rolling averages, sort by the date/grouping column first and then use pandas rolling, e.g. result['rolling_avg'] = result['metric'].rolling(3, min_periods=1).mean()
- For monthly trends, first create a monthly key with df['Date'].dt.to_period('M').astype(str), then group by that key
- Assume the Date column may already be datetime-like in the runtime environment; do not re-import date libraries
- DO NOT use import statements - all needed libraries are already available
- For aggregations, ensure result is suitable for visualization
- Keep code concise (max 10 lines)
- Return data in format: list of dicts with keys for x-axis and y-axis
- Choose chart_type based on data: bar for categories, line for time series, pie for parts of whole
- If a 'Profit' column doesn't exist but 'Revenue' and 'Cost' do, calculate it: df['Profit'] = df['Revenue'] - df['Cost']
- When filtering or selecting top N results, use only columns that answer the specific question — remove helper/temporary columns before returning result
- For percentile-based filtering: use df[df[column] >= df[column].quantile(0.95)] and handle case where no rows exist
- For month-over-month drop: first group by month/year, sort by time, calculate diff, then find max drop with pd.to_numeric()
- For conditional aggregation (e.g., "best rep min 20 orders"): first count/verify condition exists, then filter/aggregate
"""


def repair_generated_code(
    df: pd.DataFrame,
    file_data: Dict[str, Any],
    user_query: str,
    broken_code: str,
    error_message: str,
) -> Dict[str, Any]:
    client = get_ai_client()
    base_prompt = build_analysis_prompt(file_data, df)
    repair_prompt = f"""The previous code failed.

User question:
{user_query}

Broken code:
{broken_code}

Execution error:
{error_message}

Return corrected JSON only.
Requirements:
- keep the same JSON schema
- do not use import statements
- assign the final output to result
- prefer pure pandas transformations
- if the request is time-series, sort by the time key before rolling calculations
- ONLY return columns that directly answer the user's question — do NOT create synthetic/extracted columns
- remove any helper/temporary columns before returning result
- For edge cases: if filter finds 0 rows, return empty result (don't error)
- For percentile queries: handle the case where np.isnan or no rows match the condition
- For month-over-month: ensure you're comparing adjacent months correctly
"""

    response = client.chat.completions.create(
        model=settings.GROK_MODEL or "gpt-4-turbo-preview",
        messages=[
            {"role": "system", "content": base_prompt},
            {"role": "user", "content": repair_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0,
    )

    return json.loads(response.choices[0].message.content)


def call_ai_for_query(
    df: pd.DataFrame, file_data: Dict[str, Any], user_query: str
) -> Dict[str, Any]:
    client = get_ai_client()
    system_prompt = build_analysis_prompt(file_data, df)

    response = client.chat.completions.create(
        model=settings.GROK_MODEL or "gpt-4-turbo-preview",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_query},
        ],
        response_format={"type": "json_object"},
        temperature=0,
    )

    return json.loads(response.choices[0].message.content)



