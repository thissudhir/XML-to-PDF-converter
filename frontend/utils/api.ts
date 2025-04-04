export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const response = await fetch(`${baseUrl}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`, // Include token if available
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Something went wrong");
  }

  return response.json();
};
