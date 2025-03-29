// src/api/loans.js
import BASE_URL from "./config";

export async function fetchLoans() {
  const res = await fetch(`${BASE_URL}/loans/`);
  if (!res.ok) throw new Error("Failed to fetch loans");
  return res.json();
}

export const updateLoans = async (updatedLoans) => {
    const res = await fetch(`${BASE_URL}/loans/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedLoans),
    });
  
    if (!res.ok) throw new Error("Failed to update loans");
  
    return await res.json(); // optionally return updated IDs
  };

  export const fetchPortfolioSummary = async () => {
    const response = await fetch(`${BASE_URL}/loans/summary`);
    if (!response.ok) throw new Error("Failed to fetch portfolio summary");
    return await response.json();
  };