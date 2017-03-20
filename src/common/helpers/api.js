export function getError(response, json) {
  // 'message' is produced by our own APIs; 'title' is produced by some
  // store APIs that we call directly.
  const message = (
    json.payload && (json.payload.message || json.payload.title)
  ) || response.statusText;
  const error = new Error(message);
  error.response = response;
  error.json = json;
  return error;
}

export async function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    const json = await response.json();
    throw getError(response, json);
  }
}

// Just enough to satisfy higher-level code that might receive errors from
// our internal API or errors thrown directly from here.
export class APICompatibleError extends Error {
  constructor(payload) {
    super(payload.message);
    this.json = { status: 'error', payload };
  }
}
