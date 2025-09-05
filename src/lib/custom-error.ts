export class NotFoundError extends Error {
  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ValidationError extends Error {
  constructor(message = "Validation failed") {
    super(message);
    this.name = "ValidationError";
  }
}

export class ConflictError extends Error {
  constructor(message = "Resource already exists") {
    super(message);
    this.name = "ConflictError";
  }
}

export class InternalServerError extends Error {
  constructor(message = "Internal server error") {
    super(message);
    this.name = "InternalServerError";
  }
}

export class NetworkError extends Error {
  constructor(message = "Network connectivity check failed") {
    super(message);
    this.name = "NetworkError";
  }
}
