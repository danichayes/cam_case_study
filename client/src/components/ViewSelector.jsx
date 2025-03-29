const tabs = [
    { label: "Loan Table", value: "table" },
    { label: "Summary", value: "chart" },
  ];
  
  const ViewSelector = ({ currentView, setView }) => {
    return (
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setView(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all duration-150
              ${currentView === tab.value 
                ? "border-blue-500 text-blue-600" 
                : "border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  };
  
  export default ViewSelector;
  
  