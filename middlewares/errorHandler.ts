import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError";

function errorMiddleware(
  error: AppError,
  _: Request,
  response: Response,
  next: NextFunction
) {
  const status = error.status || 500;
  const message = error.message || "Something went wrong";
  response.status(status).send({
    status,
    message,
  });

  next;
}

export default errorMiddleware;
