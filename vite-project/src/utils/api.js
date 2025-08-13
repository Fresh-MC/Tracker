export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export async function fetchPlans() {
  const res = await fetch(`${API_BASE}/api/task`);
  if (!res.ok) throw new Error("Failed to fetch plans");
  return res.json();
}
