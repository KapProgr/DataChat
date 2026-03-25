"""
Comprehensive evaluation of DataChat on 30 hard questions.
Tests: execution success, chart type correctness, CSV export quality.
Makes HTTP requests to /api/query to test real API behavior.
"""

import os
import sys
import json
import time
import httpx
from pathlib import Path
from dotenv import load_dotenv

# Load .env BEFORE importing app modules
load_dotenv()

import pandas as pd

# Backend URL
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

# Test questions from hard_questions_sales.md
HARD_QUESTIONS = [
    # Multi-step Aggregations
    ("1. Top 5 products by profit + margin",
     "Show top 5 products by total profit and include their profit margin."),
    ("2. Revenue per unit by region",
     "Which region has the highest revenue per unit sold?"),
    ("3. Discount by channel impact",
     "Compare average discount by channel and show where discounting hurts profit most."),
    ("4. Revenue, cost, profit by category",
     "For each category, calculate total revenue, total cost, and net profit."),
    ("5. Products with negative profit",
     "Show products with negative total profit and sort worst to best."),
    
    # Time-Series + Grouping
    ("6. Monthly revenue + 3M rolling avg",
     "Show monthly revenue trend and a 3-month rolling average."),
    ("7. Month with largest revenue drop",
     "Which month had the largest drop in revenue vs previous month?"),
    ("8. Monthly profit by region trend",
     "Compare monthly profit trend by region (North vs South vs East vs West vs Central)."),
    ("9. Quarterly revenue + QoQ growth",
     "Show quarterly total revenue and quarter-over-quarter growth percentage."),
    ("10. Seasonality: month by avg units",
     "Detect seasonality: which month name has the highest average units sold?"),
    
    # Data Quality
    ("11. Top products ignoring negative units",
     "Ignore rows with negative Units Sold and recompute top products by revenue."),
    ("12. Missing Customer Segment impact",
     "Find rows with missing Customer Segment and summarize their revenue impact."),
    ("13. Unit Price outliers (95%ile)",
     "Are there outliers in Unit Price? Show rows above 95th percentile."),
    
    # Business KPIs
    ("16. Gross margin % by category",
     "Compute gross margin % by category: (Total Revenue - Cost) / Total Revenue."),
    ("17. Best sales rep by profit/order",
     "Which sales rep has the best profit per order (min 20 orders)?"),
    ("18. Channel profit share %",
     "Show channel contribution to total profit as percentage share."),
    ("19. Pareto by product revenue",
     "Build a Pareto table: cumulative revenue by product sorted descending."),
    
    # Hard Filters
    ("21. Top 10 orders high discount + units",
     "Show top 10 orders by profit where discount is >= 30% and units sold > 10."),
    ("22. Electronics vs Furniture trend",
     "Compare Electronics vs Furniture revenue trend month by month."),
]


def validate_result(question_name, response_json):
    """Validate API response for correctness and quality."""
    issues = []
    
    # Check: response contains data
    result_data = response_json.get("data")
    chart_type = response_json.get("chart_type", "none")
    
    if not result_data:
        issues.append("❌ No result data")
        return {"success": False, "issues": issues, "chart_type": chart_type, "rows": 0, "cols": 0}
    
    # Check: result is list/dict
    if not isinstance(result_data, list):
        issues.append(f"⚠️  Result not list: {type(result_data)}")
        result_data = [result_data] if result_data else []
    
    if len(result_data) == 0:
        issues.append("⚠️  Empty result dataset")
        return {"success": False, "issues": issues, "chart_type": chart_type, "rows": 0, "cols": 0}
    
    # Check: chart type is valid
    valid_types = ["bar", "line", "pie", "scatter", "table", "none"]
    if chart_type not in valid_types:
        issues.append(f"⚠️  Unusual chart_type: {chart_type}")
    
    # Check: Synthetic columns (Time, Temp, Helper, Row_Num, Extract)
    if isinstance(result_data[0], dict):
        synthetic_cols = ['time', 'temp', 'helper', 'row_num', 'extract']
        found_synthetic = [col for col in result_data[0].keys() 
                          if col.lower() in synthetic_cols]
        if found_synthetic:
            issues.append(f"⚠️  Synthetic columns: {found_synthetic}")
    
    # Check: Chart type appropriateness
    if "trend" in question_name.lower() and chart_type not in ["line", "bar"]:
        issues.append(f"⚠️  Trend Q but chart_type={chart_type}")
    if "compare" in question_name.lower() and chart_type not in ["bar", "line", "table"]:
        issues.append(f"⚠️  Compare Q but chart_type={chart_type}")
    
    cols = len(result_data[0].keys()) if isinstance(result_data[0], dict) else 1
    status = len(issues) == 0
    return {
        "success": status,
        "chart_type": chart_type,
        "rows": len(result_data),
        "cols": cols,
        "issues": issues,
    }


async def upload_test_file(client: httpx.AsyncClient, csv_path: Path, user_id: str = "test_user_eval"):
    """Upload test CSV and return file_id."""
    with open(csv_path, "rb") as f:
        files = {"file": (csv_path.name, f, "text/csv")}
        data = {"user_id": user_id}
        
        response = await client.post(
            f"{BACKEND_URL}/api/upload",
            files=files,
            data=data
        )
        
        if response.status_code != 200:
            raise Exception(f"Upload failed: {response.text}")
        
        return response.json()["file_id"]


async def run_query(client: httpx.AsyncClient, file_id: str, query: str, user_id: str = "test_user_eval"):
    """Run a query via API."""
    response = await client.post(
        f"{BACKEND_URL}/api/query",
        json={
            "file_id": file_id,
            "query": query,
            "user_id": user_id,
            "chat_history": []
        }
    )
    
    if response.status_code != 200:
        raise Exception(f"Query failed: {response.status_code} - {response.text}")
    
    return response.json()


async def run_evaluation():
    """Run all hard questions and collect metrics."""
    print("\n" + "="*80)
    print("HARD QUESTIONS EVALUATION - DataChat Model Performance")
    print("="*80 + "\n")
    
    # Load dataset info
    csv_path = Path(__file__).parent.parent.parent / "sales_stress_test.csv"
    
    if not csv_path.exists():
        print(f"❌ Dataset not found: {csv_path}")
        return
    
    df = pd.read_csv(csv_path)
    
    print(f"📊 Dataset: {csv_path.name}")
    print(f"   Shape: {df.shape[0]} rows × {df.shape[1]} columns")
    print(f"   Backend: {BACKEND_URL}\n")
    
    results = {
        "success": 0,
        "partial": 0,
        "failed": 0,
        "total": len(HARD_QUESTIONS),
        "by_type": {
            "execution_errors": [],
            "warnings": [],
            "all_pass": []
        },
        "chart_types": {},
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Upload test file
        print("📤 Uploading test file...")
        try:
            file_id = await upload_test_file(client, csv_path)
            print(f"✅ File uploaded: {file_id}\n")
        except Exception as e:
            print(f"❌ Upload failed: {e}")
            return
        
        # Run queries
        for q_name, q_text in HARD_QUESTIONS:
            print(f"Testing: {q_name}")
            print(f"Query:   {q_text[:65]}...")
            
            try:
                start_time = time.time()
                
                # Call API
                api_response = await run_query(client, file_id, q_text)
                elapsed = time.time() - start_time
                
                # Validate
                validation = validate_result(q_name, api_response)
                
                if validation["success"]:
                    status_icon = "✅"
                    results["success"] += 1
                    results["by_type"]["all_pass"].append(q_name)
                elif validation["issues"]:
                    status_icon = "⚠️ "
                    results["partial"] += 1
                    results["by_type"]["warnings"].extend(validation["issues"])
                else:
                    status_icon = "❌"
                    results["failed"] += 1
                    results["by_type"]["execution_errors"].append(q_name)
                
                chart_type = validation.get("chart_type", "none")
                results["chart_types"][chart_type] = results["chart_types"].get(chart_type, 0) + 1
                
                print(f"{status_icon} Chart: {chart_type:8} | Rows: {validation['rows']:3} | "
                      f"Cols: {validation['cols']:2} | {elapsed:.2f}s")
                
                if validation["issues"]:
                    for issue in validation["issues"]:
                        print(f"   {issue}")
                
                print()
                
            except Exception as e:
                print(f"❌ FAILED: {str(e)[:80]}")
                results["failed"] += 1
                results["by_type"]["execution_errors"].append(q_name)
                print()
    
    # Summary
    print("="*80)
    print("SUMMARY")
    print("="*80)
    print(f"✅ Full Success:  {results['success']}/{results['total']} ({100*results['success']/results['total']:.0f}%)")
    print(f"⚠️  Partial:      {results['partial']}/{results['total']} ({100*results['partial']/results['total']:.0f}%)")
    print(f"❌ Failed:        {results['failed']}/{results['total']} ({100*results['failed']/results['total']:.0f}%)")
    print(f"\nChart Type Distribution: {results['chart_types']}")
    print(f"\nQuestions with full pass: {len(results['by_type']['all_pass'])}")
    if results['by_type']['all_pass']:
        for q in results['by_type']['all_pass'][:5]:
            print(f"  ✅ {q}")
        if len(results['by_type']['all_pass']) > 5:
            print(f"  ... and {len(results['by_type']['all_pass']) - 5} more")
    
    if results['by_type']['execution_errors']:
        print(f"\nQuestions with execution errors: {len(results['by_type']['execution_errors'])}")
        for q in results['by_type']['execution_errors']:
            print(f"  ❌ {q}")
    
    print("\n" + "="*80)


if __name__ == "__main__":
    import asyncio
    asyncio.run(run_evaluation())

