const BASE_URL = import.meta.env.DEV
  ? "http://localhost:5001"
  : import.meta.env.VITE_API_URL;

export default BASE_URL;