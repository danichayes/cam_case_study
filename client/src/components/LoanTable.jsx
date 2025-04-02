import { useEffect, useState, useRef, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { fetchLoans, updateLoans } from "../api/loans";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

const LoanTable = () => {
  const [rowData, setRowData] = useState([]);
  const [dirtyRows, setDirtyRows] = useState([]);
  const [visibleSummary, setVisibleSummary] = useState({
    count: 0,

    original_principal_sum: 0,
    original_principal_avg: 0,

    current_principal_sum: 0,
    current_principal_avg: 0,

    property_value_sum: 0,
    property_value_avg: 0,

    interest_rate_avg: 0,
    payment_avg: 0,
    loan_to_value_ratio_avg: 0,
  });
  const gridRef = useRef(null);

  const calculateVisibleSummary = () => {
    const rows =
      gridRef.current?.api?.getModel().rowsToDisplay.map((r) => r.data) || [];
    const count = rows.length;
    const sum = (key) =>
      rows.reduce((acc, r) => acc + (parseFloat(r[key]) || 0), 0);
    const avg = (key) => (count ? sum(key) / count : 0);

    const avgLTV = (() => {
      const ltvVals = rows
        .map(
          (r) => parseFloat(r.current_principal) / parseFloat(r.property_value)
        )
        .filter((v) => isFinite(v));
      return ltvVals.length
        ? ltvVals.reduce((a, b) => a + b, 0) / ltvVals.length
        : null;
    })();

    return {
      original_principal_sum: sum("original_principal"),
      original_principal_avg: avg("original_principal"),
      current_principal_sum: sum("current_principal"),
      current_principal_avg: avg("current_principal"),
      property_value_sum: sum("property_value"),
      property_value_avg: avg("property_value"),
      payment_avg: avg("payment"),
      interest_rate_avg: avg("interest_rate"),
      loan_to_value_ratio_avg: avgLTV,
      count,
    };
  };

  const onFilterChanged = () => {
    setVisibleSummary(calculateVisibleSummary());
  };

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Loan ID",
        field: "id",
        filter: true,
        floatingFilter: true,
      },
      { headerName: "Pool", field: "pool_name", filter: true },
      { headerName: "State", field: "state", filter: "agSetColumnFilter" },
      { headerName: "City", field: "city", filter: "agSetColumnFilter" },
      { headerName: "Loan Date", field: "loan_date" },
      {
        headerName: "Original Principal",
        field: "original_principal",
        valueFormatter: (params) =>
          params.value != null ? `$${params.value.toLocaleString()}` : "—",
      },
      {
        headerName: "Current Principal",
        field: "current_principal",
        editable: true,
        valueFormatter: (params) =>
          params.value != null ? `$${params.value.toLocaleString()}` : "—",
      },
      {
        headerName: "Property Value",
        field: "property_value",
        filter: "agNumberColumnFilter",
        sortable: true,
        floatingFilter: true,
        resizable: true,
        editable: true,
        valueFormatter: (params) =>
          params.value != null
            ? `$${parseFloat(params.value).toLocaleString()}`
            : "—",
      },
      {
        headerName: "LTV",
        valueGetter: (params) => {
          const principal = parseFloat(params.data.current_principal);
          const value = parseFloat(params.data.property_value);
          if (!principal || !value || value === 0) return null;
          return +(principal / value).toFixed(6);
        },
        filter: "agNumberColumnFilter",
        valueFormatter: (params) =>
          params.value != null ? `${(params.value * 100).toFixed(2)}%` : "—",
      },
      {
        headerName: "Interest Rate",
        field: "interest_rate",
        editable: true,
        filter: "agNumberColumnFilter",
        valueFormatter: (params) =>
          params.value != null ? `${parseFloat(params.value).toFixed(2)}%` : "",
        valueParser: (params) => {
          const raw = params.newValue?.toString().replace("%", "").trim();
          const parsed = parseFloat(raw);
          return isNaN(parsed) ? null : parsed;
        },
      },
      {
        headerName: "Payment",
        field: "payment",
        editable: true,
        valueFormatter: (params) =>
          params.value != null ? `$${params.value.toLocaleString()}` : "—",
      },
      {
        headerName: "Expected Duration",
        valueGetter: (params) => {
          const principal = parseFloat(params.data.current_principal);
          const payment = parseFloat(params.data.payment);
          let rateRaw = params.data.interest_rate;

          const annualRate =
            typeof rateRaw === "string"
              ? parseFloat(rateRaw.replace("%", ""))
              : parseFloat(rateRaw);

          const r = annualRate / 100 / 12;

          if (!principal || !payment || isNaN(annualRate))
            return "non-amortizing";
          if (payment <= r * principal) return "non-amortizing";

          if (r === 0) {
            return Math.ceil(principal / payment);
          }

          const numerator = Math.log(1 - (r * principal) / payment);
          const denominator = Math.log(1 + r);
          const months = -numerator / denominator;

          return Math.round(months);
        },
        valueFormatter: (params) => {
          if (params.value === "non-amortizing") return "Non-amortizing loan";
          if (params.value == null) return "—";
          return `${params.value} mo`;
        },
        sortable: true,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        resizable: true,
      },
      { headerName: "Borrower", field: "borrower" },
      { headerName: "Address", field: "address" },
      { headerName: "Zip", field: "zip" },
    ],
    []
  );

  const handleCellEdit = (params) => {
    const updatedRow = params.data;

    setDirtyRows((prev) => {
      const exists = prev.some((row) => row.id === updatedRow.id);
      return exists
        ? prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
        : [...prev, updatedRow];
    });
    setVisibleSummary(calculateVisibleSummary());
  };

  const handleDiscard = () => {
    setDirtyRows([]);
    loadData();
    setVisibleSummary(calculateVisibleSummary());
  };

  const defaultColDef = {
    sortable: true,
    filter: true,
    floatingFilter: true,
    resizable: true,
  };

  const loadData = () => {
    fetchLoans()
      .then((data) => setRowData(data))
      .catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);
  useEffect(() => {
    setVisibleSummary(calculateVisibleSummary());
  }, [rowData]);

  const handleSave = async () => {
    try {
      const result = await updateLoans(dirtyRows);
      console.log("Update success:", result);
      setDirtyRows([]);
      setVisibleSummary(calculateVisibleSummary());
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  return (
    <div>
      <div
        className="ag-theme-alpine"
        style={{ height: "550px", width: "300%" }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          enableFilter={true}
          floatingFilter={true}
          pagination={true}
          onCellValueChanged={handleCellEdit}
          onFilterChanged={onFilterChanged}
        />
      </div>

      {visibleSummary && (
        <div className="mt-6 border p-4 rounded bg-white shadow text-sm max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold mb-2">Visible Loan Summary</h3>
          <div className="grid grid-cols-2 gap-3 text-left">
            <div>
              <strong>Total Loans:</strong> {visibleSummary.count}
            </div>
            <div>
              <strong>Original Principal (Sum):</strong> $
              {visibleSummary.original_principal_sum.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </div>
            <div>
              <strong>Original Principal (Avg):</strong> $
              {visibleSummary.original_principal_avg.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </div>
            <div>
              <strong>Current Principal (Sum):</strong> $
              {visibleSummary.current_principal_sum.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </div>
            <div>
              <strong>Current Principal (Avg):</strong> $
              {visibleSummary.current_principal_avg.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </div>
            <div>
              <strong>Property Value (Sum):</strong> $
              {visibleSummary.property_value_sum.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </div>
            <div>
              <strong>Property Value (Avg):</strong> $
              {visibleSummary.property_value_avg.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </div>
            <div>
              <strong>Interest Rate (Avg):</strong>{" "}
              {visibleSummary.interest_rate_avg.toFixed(2)}%
            </div>
            <div>
              <strong>Payment (Avg):</strong> $
              {visibleSummary.payment_avg.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </div>
            <div>
              <strong>LTV (Avg):</strong>{" "}
              {visibleSummary.loan_to_value_ratio_avg != null
                ? `${(visibleSummary.loan_to_value_ratio_avg * 100).toFixed(
                    2
                  )}%`
                : "—"}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center mt-6">
        <button
          onClick={handleSave}
          disabled={dirtyRows.length === 0}
          className="px-4 py-2 mx-2 rounded border border-gray-300 text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Changes
        </button>
        <button
          onClick={handleDiscard}
          disabled={dirtyRows.length === 0}
          className={`px-4 py-2 rounded border text-sm font-medium transition
            ${
              dirtyRows.length === 0
                ? "bg-gray-300 text-gray-600 cursor-not-allowed opacity-70"
                : "bg-white border-gray-400 hover:bg-gray-100 text-gray-800"
            }`}
        >
          Discard Changes
        </button>
      </div>
    </div>
  );
};

export default LoanTable;
