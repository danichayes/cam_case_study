import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { fetchPoolSummary } from "../api/pools";

const metricOptions = [
  { label: "Total Property Value", value: "total_property_value" },
  { label: "Average Property Value", value: "avg_property_value" },
  { label: "Total Outstanding Principal", value: "total_current_principal" },
  { label: "Average Outstanding Principal", value: "avg_current_principal" },
  { label: "Total Original Principal", value: "total_original_principal" },
  { label: "Average Original Principal", value: "avg_original_principal" },
  { label: "Average Interest Rate", value: "avg_interest_rate" },
  { label: "Average Payment", value: "avg_payment" },
];

const PoolStats = () => {
  const [data, setData] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState("total_property_value");

  useEffect(() => {
    fetchPoolSummary()
      .then((data) => {
        const coloredData = data.map((item, index) => ({
          ...item,
          fill: index % 2 === 0 ? "#ef4444" : "#3b82f6",
        }));
        setData(coloredData);
      })
      .catch((err) => console.error("Failed to load summary:", err));
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto text-center px-4 py-8">
      <h2 className="text-2xl font-semibold mb-4">Pool Overview</h2>

      <div className="mb-6">
        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          className="px-4 py-2 border rounded text-sm"
        >
          {metricOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="90%" height={400} className="mx-auto">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 30, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="pool_name" />
          <YAxis />
          <Tooltip
            formatter={(value) =>
              value.toLocaleString(undefined, { maximumFractionDigits: 2 })
            }
          />
          <Bar dataKey={selectedMetric} radius={[4, 4, 0, 0]} fillOpacity={1}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PoolStats;
