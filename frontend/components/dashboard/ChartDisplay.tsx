"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ChartDisplayProps {
  data: any;
  type: string;
}

const COLORS = [
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];

export default function ChartDisplay({ data, type }: ChartDisplayProps) {
  const chartData = Array.isArray(data) ? data : [data];

  if (!chartData || chartData.length === 0) {
    return (
      <div className="text-center py-8 text-white/70">
        No visualization data available
      </div>
    );
  }

  const keys = Object.keys(chartData[0] || {});
  const xKey = keys[0];
  const yKey = keys[1] || keys[0];

  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey={xKey} stroke="#fff" />
          <YAxis stroke="#fff" />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(0,0,0,0.8)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "8px",
            }}
          />
          <Legend />
          {keys
            .filter((key) => typeof chartData[0][key] === "number")
            .map((key, i) => (
              <Bar
                key={key}
                dataKey={key}
                fill={COLORS[i % COLORS.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey={xKey} stroke="#fff" />
          <YAxis stroke="#fff" />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(0,0,0,0.8)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "8px",
            }}
          />
          <Legend />
          {keys
            .filter((key) => typeof chartData[0][key] === "number")
            .map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === "pie") {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey={yKey}
            nameKey={xKey}
            cx="50%"
            cy="50%"
            outerRadius={120}
            label
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === "scatter") {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey={xKey} stroke="#fff" />
          <YAxis dataKey={yKey} stroke="#fff" />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(0,0,0,0.8)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "8px",
            }}
          />
          <Scatter data={chartData} fill="#8b5cf6" />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  // Default: table view
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/20">
            {keys.map((key) => (
              <th
                key={key}
                className="text-left p-3 text-purple-300 font-semibold"
              >
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chartData.map((row, idx) => (
            <tr key={idx} className="border-b border-white/10">
              {keys.map((key) => (
                <td key={key} className="p-3 text-white">
                  {String(row[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}