"""Quick test: verify that API data matches CSV export."""
import httpx
import json

BACKEND_URL = "http://localhost:8000"

async def test_csv_export():
    async with httpx.AsyncClient(timeout=30) as client:
        # Q8: Monthly profit by region (should have 6 columns after pivot)
        query = "Compare monthly profit trend by region (North vs South vs East vs West vs Central)."
        
        response = await client.post(
            f"{BACKEND_URL}/api/query",
            json={
                "file_id": "file_2_1773759726.922944",
                "query": query,
                "user_id": "test",
                "chat_history": []
            }
        )
        
        data = response.json()
        
        print("="*80)
        print("API RESPONSE CHECK")
        print("="*80)
        print(f"Chart type: {data.get('chart_type')}")
        print(f"Rows: {len(data.get('data', []))}")
        
        if data.get('data'):
            first_row = data['data'][0]
            print(f"Columns: {list(first_row.keys())}")
            print(f"\nFirst 3 rows:")
            for i, row in enumerate(data['data'][:3]):
                print(f"  Row {i+1}: {row}")
        
        print("\n" + "="*80)
        print("CSV EXPORT SIMULATION")
        print("="*80)
        
        # Simulate CSV export (from dashboard/page.tsx)
        rows = data.get('data', [])
        if rows:
            headers = list(rows[0].keys())
            print(f"Headers: {headers}")
            print("\nCSV Content:")
            print(",".join(headers))
            for row in rows[:3]:
                values = [str(row.get(h, "")) for h in headers]
                print(",".join(values))


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_csv_export())
