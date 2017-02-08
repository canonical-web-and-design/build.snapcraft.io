export function getError(response, json) {
  const message = (json.payload && json.payload.message) ||
                  response.statusText;
  const error = new Error(message);
  error.response = response;
  error.json = json;
  return error;
}

export function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    return response.json().then((json) => {
      throw getError(response, json);
    });
  }
}
