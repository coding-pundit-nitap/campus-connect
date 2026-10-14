import { describe, expect, it } from "vitest";

import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NetworkError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
  ValidationError,
} from "./custom-error";

describe("custom errors", () => {
  it.each([
    [NotFoundError, "NotFoundError", "Resource not found"],
    [UnauthorizedError, "UnauthorizedError", "Unauthorized"],
    [ForbiddenError, "ForbiddenError", "Forbidden"],
    [UnauthenticatedError, "UnauthenticatedError", "Unauthenticated"],
    [ValidationError, "ValidationError", "Validation failed"],
    [ConflictError, "ConflictError", "Resource already exists"],
    [InternalServerError, "InternalServerError", "Internal server error"],
    [NetworkError, "NetworkError", "Network connectivity check failed"],
    [BadRequestError, "BadRequestError", "Bad request"],
  ])("%o has name %s and a default message", (ErrorClass, name, message) => {
    const error = new ErrorClass();

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ErrorClass);
    expect(error.name).toBe(name);
    expect(error.message).toBe(message);
  });

  it.each([
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    UnauthenticatedError,
    ValidationError,
    ConflictError,
    InternalServerError,
    NetworkError,
    BadRequestError,
  ])("%o accepts a custom message", (ErrorClass) => {
    expect(new ErrorClass("custom").message).toBe("custom");
  });
});
