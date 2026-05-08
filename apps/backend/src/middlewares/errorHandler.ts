import { Request, Response, NextFunction } from "express";
import { createChildLogger } from "../lib/logger";

const log = createChildLogger("error-handler");

interface AppError extends Error {
  status?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status ?? 500;
  const message = err.message || "Internal Server Error";

  if (status >= 500) {
    log.error({ err, status }, "Unhandled error");
  } else {
    log.warn({ status, message }, "Client error");
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
