export function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object" &&
    (error as { response: unknown }).response !== null &&
    "data" in (error as { response: { data?: unknown } }).response &&
    typeof (error as { response: { data?: unknown } }).response.data ===
      "object" &&
    (error as { response: { data: unknown } }).response.data !== null &&
    "message" in
      (error as { response: { data: { message?: unknown } } }).response.data
  ) {
    return String(
      (error as { response: { data: { message: unknown } } }).response.data
        .message
    );
  }
  return fallback;
}
