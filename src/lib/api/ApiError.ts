/**
 * Error thrown for every non-2xx response from the FitBase API.
 * `code` matches the backend's `{"code": "...", "message": "..."}` body,
 * which is what getAuthErrorMessage() in authErrors.ts switches on.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}
