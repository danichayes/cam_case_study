import { useState } from "react";
import LoanTable from "./LoanTable";
import PoolBarChart from "./PoolBarChart";
import ViewSelector from "./ViewSelector";
import PortfolioSummary from "./PortfolioSummary";

const Dashboard = () => {
  const [view, setView] = useState("table"); // or 'chart'

  console.log(view)
  return (
    <div className="p-4 max-w-screen-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Loan Portfolio Dashboard</h1>
      <ViewSelector currentView={view} setView={setView} />
      <div className="mt-6">
        {view === "table" && <LoanTable />}
        {view === "chart" && (
          <>
            <PoolBarChart />
            <PortfolioSummary />
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
