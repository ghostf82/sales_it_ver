import type { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("API Error:", err);

  let statusCode = 500;
  let message = "internal_server_error";

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = err.message;
  } else if (err.code === "PGRST116") {
    statusCode = 404;
    message = "resource_not_found";
  } else if (err.code === "23505") {
    statusCode = 409;
    message = "resource_already_exists";
  } else if (err.code === "23503") {
    statusCode = 400;
    message = "invalid_reference";
  } else if (err.message) {
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
}