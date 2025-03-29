import { useEffect, useState } from "react";
import { fetchPortfolioSummary } from "../api/loans";

const PortfolioSummary = () => {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchPortfolioSummary()
      .then(setSummary)
      .catch((err) => console.error("Failed to fetch portfolio summary:", err));
  }, []);

  if (!summary) return null;

  const formatCurrency = (val) => `$${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  const formatPercent = (val) => `${val.toFixed(2)}%`;

  const totalLTV =
    summary.total_property_value > 0
      ? (summary.total_current_principal / summary.total_property_value) * 100
      : 0;

  return (
    <div className="mt-10 p-6 border rounded shadow max-w-3xl mx-auto text-left bg-white">
      <h3 className="text-xl font-semibold mb-4">Portfolio Summary</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>Average Interest Rate: <strong>{formatPercent(summary.avg_interest_rate)}</strong></div>
        <div>Average Payment: <strong>{formatCurrency(summary.avg_payment)}</strong></div>
        <div>Average Original Principal: <strong>{formatCurrency(summary.avg_original_principal)}</strong></div>
        <div>Total Original Principal: <strong>{formatCurrency(summary.total_original_principal)}</strong></div>
        <div>Average Outstanding Principal: <strong>{formatCurrency(summary.avg_current_principal)}</strong></div>
        <div>Total Outstanding Principal: <strong>{formatCurrency(summary.total_current_principal)}</strong></div>
        <div>Average Property Value: <strong>{formatCurrency(summary.avg_property_value)}</strong></div>
        <div>Total Property Value: <strong>{formatCurrency(summary.total_property_value)}</strong></div>
        <div>Total Loan-to-Value (LTV): <strong>{formatPercent(totalLTV)}</strong></div>
      </div>
    </div>
  );
};

export default PortfolioSummary;