export function success(data, message = "Success") {
  return { ok: true, message, data };
}

export function failure(message = "Something went wrong", status = 400) {
  return { ok: false, message, status };
}
