const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function parseError(response) {
  try {
    const body = await response.json();
    return body.error || `Request failed (${response.status}).`;
  } catch {
    return `Request failed (${response.status}).`;
  }
}

async function postApiRequest(endpoint, url) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response;
}

export async function fetchVideoInfo(url) {
  const response = await postApiRequest("/api/info", url);
  return response.json();
}

export async function convertVideoToAudio(url) {
  return (await postApiRequest("/api/convert", url)).blob();
}
