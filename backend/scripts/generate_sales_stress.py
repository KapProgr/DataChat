from __future__ import annotations

import random
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd


def main() -> None:
    random.seed(42)

    products = [
        "Laptop Pro",
        "Laptop Air",
        "Office Chair",
        "Desk Lamp",
        "Wireless Mouse",
        "Mechanical Keyboard",
        "Notebook Set",
        "Monitor 27in",
        "Docking Station",
        "Webcam HD",
        "Printer Laser",
        "Standing Desk",
    ]
    categories = {
        "Laptop Pro": "Electronics",
        "Laptop Air": "Electronics",
        "Office Chair": "Furniture",
        "Desk Lamp": "Furniture",
        "Wireless Mouse": "Electronics",
        "Mechanical Keyboard": "Electronics",
        "Notebook Set": "Stationery",
        "Monitor 27in": "Electronics",
        "Docking Station": "Electronics",
        "Webcam HD": "Electronics",
        "Printer Laser": "Office Equipment",
        "Standing Desk": "Furniture",
    }
    regions = ["North", "South", "East", "West", "Central"]
    channels = ["Online", "Retail", "Partner"]

    rows = []
    start = datetime(2024, 1, 1)

    for i in range(1200):
        date = start + timedelta(days=i % 365)
        product = random.choice(products)
        category = categories[product]
        region = random.choice(regions)
        channel = random.choice(channels)

        units = random.randint(1, 120)
        unit_price = random.choice([25, 45, 80, 120, 150, 300, 900, 1200])

        # Controlled anomalies: returns / corrections / discount extremes
        if random.random() < 0.03:
            units = -random.randint(1, 10)
        discount_pct = random.choice([0, 0, 0, 5, 10, 15, 20, 30, 50])
        if random.random() < 0.01:
            discount_pct = 70

        gross_revenue = units * unit_price
        discount_value = gross_revenue * (discount_pct / 100.0)
        total_revenue = gross_revenue - discount_value
        cost = abs(units) * unit_price * random.uniform(0.45, 0.85)
        profit = total_revenue - cost

        # Make date formats intentionally inconsistent for robustness testing
        if i % 17 == 0:
            date_text = date.strftime("%Y-%m-%d")
        elif i % 17 == 1:
            date_text = date.strftime("%d/%m/%Y")
        else:
            date_text = date.strftime("%Y/%m/%d")

        # Missing and noisy cells
        customer_segment = random.choice(["SMB", "Enterprise", "Consumer", "Public", "Startup", None])
        sales_rep = random.choice(["Alex", "Maria", "Nikos", "Sofia", "Chris", "Eleni", "John", ""])

        rows.append(
            {
                "Date": date_text,
                "Product": product,
                "Category": category,
                "Region": region,
                "Channel": channel,
                "Customer Segment": customer_segment,
                "Sales Rep": sales_rep,
                "Units Sold": units,
                "Unit Price": round(unit_price, 2),
                "Discount %": discount_pct,
                "Total Revenue": round(total_revenue, 2),
                "Cost": round(cost, 2),
                "Profit": round(profit, 2),
                "Order ID": f"ORD-{100000 + i}",
            }
        )

    df = pd.DataFrame(rows)

    root = Path(__file__).resolve().parents[2]
    out_file = root / "sales_stress_test.csv"
    df.to_csv(out_file, index=False)

    print(f"Generated {len(df)} rows at: {out_file}")


if __name__ == "__main__":
    main()
