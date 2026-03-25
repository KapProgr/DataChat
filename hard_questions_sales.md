# Hard Questions For DataChat (Sales Stress Test)

Use these prompts directly in chat after uploading sales_stress_test.csv.

## Multi-step Aggregations
1. Show top 5 products by total profit and include their profit margin.
2. Which region has the highest revenue per unit sold?
3. Compare average discount by channel and show where discounting hurts profit most.
4. For each category, calculate total revenue, total cost, and net profit.
5. Show products with negative total profit and sort worst to best.

## Time-Series + Grouping
6. Show monthly revenue trend and a 3-month rolling average.
7. Which month had the largest drop in revenue vs previous month?
8. Compare monthly profit trend by region (North vs South vs East vs West vs Central).
9. Show quarterly total revenue and quarter-over-quarter growth percentage.
10. Detect seasonality: which month name has the highest average units sold?

## Data Quality / Edge Cases
11. Ignore rows with negative Units Sold and recompute top products by revenue.
12. Find rows with missing Customer Segment and summarize their revenue impact.
13. Are there outliers in Unit Price? Show rows above 95th percentile.
14. Show how many date values fail datetime parsing and list sample problematic rows.
15. Compare results with and without negative units and explain the difference.

## Business KPIs
16. Compute gross margin % by category: (Total Revenue - Cost) / Total Revenue.
17. Which sales rep has the best profit per order (min 20 orders)?
18. Show channel contribution to total profit as percentage share.
19. Build a Pareto table: cumulative revenue by product sorted descending.
20. Which segment-region pair has the highest average order value?

## Hard Filters / Logic
21. Show top 10 orders by profit where discount is >= 30% and units sold > 10.
22. Compare Electronics vs Furniture revenue trend month by month.
23. Find products with consistently positive monthly profit (no negative month).
24. Identify regions where higher discount correlates with lower profit.
25. For each channel, find the product with highest median profit.

## Stress / Prompt Robustness
26. Give me a CFO summary: 5 bullets + one table with the most critical KPI by region.
27. Explain in plain Greek what drives low profit and show supporting data.
28. If we cut discount by 5 points for all orders above 30%, estimate extra profit.
29. Predict next month revenue using a simple trend from last 6 months.
30. Build an executive dashboard table: revenue, profit, margin %, avg discount, growth %.

## What Good Looks Like
- It should return valid results without code execution errors.
- Chart type should match the question (line for trends, bar for comparisons, pie for shares).
- Explanations should be short and business-readable.
- Calculations should be numerically plausible and consistent.
