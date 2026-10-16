/** Domain error mapped to an HTTP response. `code` is stable; the web app localizes it. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export const notFound = (code = "NOT_FOUND") => new HttpError(404, code);
export const forbidden = (code = "FORBIDDEN") => new HttpError(403, code);
export const conflict = (code: string) => new HttpError(409, code);
export const badRequest = (code: string) => new HttpError(400, code);
