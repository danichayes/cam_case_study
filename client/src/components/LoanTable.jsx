import { useEffect, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { fetchLoans, updateLoans } from "../api/loans";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

const LoanTable = () => {
  const [rowData, setRowData] = useState([]);
  const [dirtyRows, setDirtyRows] = useState([]);

  const columnDefs = [
    { headerName: "Loan ID", field: "id", filter: true, floatingFilter: true },
    { headerName: "Pool", field: "pool_name", filter: true },
    { headerName: "State", field: "state", filter: "agSetColumnFilter" },
    { headerName: "City", field: "city", filter: "agSetColumnFilter" },
    { headerName: "Loan Date", field: "loan_date" },
    { headerName: "Original Principal", field: "original_principal" },
    {
      headerName: "Current Principal",
      field: "current_principal",
      editable: true,
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
        return +(principal / value).toFixed(6); // rounded to 6 decimals
      },
      valueFormatter: (params) =>
        params.value != null ? `${(params.value * 100).toFixed(2)}%` : "—",
      filter: "agNumberColumnFilter",
    }, // want to calc this on the front end so it can update in real time with changes to current principal and property value
    {
      headerName: "Interest Rate",
      field: "interest_rate",
      editable: true,
      filter: "agNumberColumnFilter",
      valueFormatter: (params) =>
        params.value != null ? `${parseFloat(params.value).toFixed(2)}%` : "",
      valueParser: (params) => {
        // Remove % sign if user types it in, and convert to float
        const raw = params.newValue?.toString().replace("%", "").trim();
        const parsed = parseFloat(raw);
        return isNaN(parsed) ? null : parsed;
      },
    },
    { headerName: "Payment", field: "payment", editable: true },
    {
      headerName: "Expected Duration",
      valueGetter: (params) => {
        const principal = parseFloat(params.data.current_principal);
        const payment = parseFloat(params.data.payment);
        let rateRaw = params.data.interest_rate;
      
        const annualRate = typeof rateRaw === "string"
          ? parseFloat(rateRaw.replace("%", ""))
          : parseFloat(rateRaw);
      
        const r = annualRate / 100 / 12;
      
        if (!principal || !payment || isNaN(annualRate)) return "non-amortizing";
        if (payment <= r * principal) return "non-amortizing";
      
        if (r === 0) {
          // No interest: months = principal / payment
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
      filter: "agTextColumnFilter", // now filtering mixed content (string + number)
      floatingFilter: true,
      resizable: true,
    },

    { headerName: "Borrower", field: "borrower" },
    { headerName: "Address", field: "address" },
    { headerName: "Zip", field: "zip" },
  ];

  const handleCellEdit = (params) => {
    const updatedRow = params.data;
  
    setDirtyRows((prev) => {
      const exists = prev.some((row) => row.id === updatedRow.id);
      if (exists) {
        return prev.map((row) => (row.id === updatedRow.id ? updatedRow : row));
      } else {
        return [...prev, updatedRow];
      }
    });
  };

  const handleDiscard = () => {
    setDirtyRows([]);
    loadData();
  };

  const defaultColDef = {
    sortable: true,
    filter: true,
    floatingFilter: true,
    resizable: true,
    // width: 150, // optional: makes columns auto-stretch
  };
  const loadData = () => {
    fetchLoans()
      .then((data) => setRowData(data))
      .catch(console.error);
  };
  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    try {
      const result = await updateLoans(dirtyRows);
      console.log("Update success:", result);
      setDirtyRows([]);
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
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          enableFilter={true}
          floatingFilter={true}
          pagination={true}
          onCellValueChanged={handleCellEdit}
        />
      </div>
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
            ${dirtyRows.length === 0
              ? "bg-gray-300 text-gray-600 cursor-not-allowed opacity-70"
              : "bg-white border-gray-400 hover:bg-gray-100 text-gray-800"}`}
        >
          Discard Changes
        </button>
      </div>
    </div>
  );
};

export default LoanTable;
