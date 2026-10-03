export const DEFAULT_BACKEND_URL = 
  process.env.NEXT_PUBLIC_BACKEND_URL || 
  process.env.NEXT_PUBLIC_API_URL || 
  "http://localhost:8000";

export const getBackendUrl = (): string => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("kairo_backend_url");
    if (saved && saved.trim() !== "") {
      let trimmed = saved.trim();
      return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
    }
  }

  let url = DEFAULT_BACKEND_URL;
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  return url;
};

export const setCustomBackendUrl = (newUrl: string): void => {
  if (typeof window === "undefined") return;
  let trimmed = newUrl.trim();
  if (trimmed.endsWith("/")) {
    trimmed = trimmed.slice(0, -1);
  }
  localStorage.setItem("kairo_backend_url", trimmed);
  window.dispatchEvent(new CustomEvent("kairo_backend_url_changed", { detail: trimmed }));
};

export const resetBackendUrl = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("kairo_backend_url");
  window.dispatchEvent(new CustomEvent("kairo_backend_url_changed", { detail: DEFAULT_BACKEND_URL }));
};

