import { Response } from "express";
import type { ApiResponse } from "../types";

export function success<T>(res: Response, data: T, message = "Success", statusCode = 200): void {
  const response: ApiResponse<T> = { success: true, message, data };
  res.status(statusCode).json(response);
}

export function created<T>(res: Response, data: T, message = "Created"): void {
  success(res, data, message, 201);
}

export function error(
  res: Response,
  message: string,
  statusCode = 500,
  errors?: Array<{ field: string; message: string }>
): void {
  const response: ApiResponse = { success: false, message, errors };
  res.status(statusCode).json(response);
}

export function validationError(
  res: Response,
  errors: Array<{ field: string; message: string }>,
  message = "Validation failed"
): void {
  error(res, message, 422, errors);
}

export function notFound(res: Response, message = "Resource not found"): void {
  error(res, message, 404);
}

export function unauthorized(res: Response, message = "Authentication required"): void {
  error(res, message, 401);
}

export function forbidden(res: Response, message = "Access denied"): void {
  error(res, message, 403);
}

export function tooManyRequests(res: Response, message = "Rate limit exceeded"): void {
  error(res, message, 429);
}
