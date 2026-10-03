export const getBackendUrl = (): string => {
  let url = 
    process.env.NEXT_PUBLIC_BACKEND_URL || 
    process.env.NEXT_PUBLIC_API_URL || 
    "http://localhost:8000";
  // Remove trailing slash if present
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  return url;
};
