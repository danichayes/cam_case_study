const API_URL = import.meta.env.DEV
  ? "http://localhost:5001"
  : import.meta.env.VITE_API_URL;

export const fetchPoolSummary = async () => {
  const response = await fetch(`${API_URL}/pools/summary`);
  if (!response.ok) throw new Error("Failed to fetch pool summary");
  return await response.json();
};