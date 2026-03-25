"use client";

interface DataPreviewProps {
  data: any[];
  headers: string[];
}

export default function DataPreview({ data, headers }: DataPreviewProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <p className="text-white/70 text-center">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <h3 className="text-lg font-bold text-white mb-4">Data Preview</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/20">
              {headers.map((header) => (
                <th
                  key={header}
                  className="text-left p-3 text-purple-300 font-semibold whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-white/10 hover:bg-white/5 transition"
              >
                {headers.map((header) => (
                  <td key={header} className="p-3 text-white whitespace-nowrap">
                    {row[header] !== null && row[header] !== undefined
                      ? String(row[header])
                      : "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 10 && (
          <p className="text-xs text-purple-300 mt-3 text-center">
            Showing first 10 of {data.length} rows
          </p>
        )}
      </div>
    </div>
  );
}