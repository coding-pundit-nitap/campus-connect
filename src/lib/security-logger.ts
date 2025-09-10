/**
 * Security event logging and monitoring utilities
 * Helps track security-related events for monitoring and incident response
 */

export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecuritySeverity;
  message: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILURE = "LOGIN_FAILURE",
  LOGOUT = "LOGOUT",
  REGISTRATION = "REGISTRATION",
  PASSWORD_CHANGE = "PASSWORD_CHANGE",

  // Authorization events
  ACCESS_DENIED = "ACCESS_DENIED",
  PRIVILEGE_ESCALATION_ATTEMPT = "PRIVILEGE_ESCALATION_ATTEMPT",

  // Security violations
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  SUSPICIOUS_REQUEST = "SUSPICIOUS_REQUEST",
  FILE_UPLOAD_VIOLATION = "FILE_UPLOAD_VIOLATION",
  XSS_ATTEMPT = "XSS_ATTEMPT",
  SQL_INJECTION_ATTEMPT = "SQL_INJECTION_ATTEMPT",
  PATH_TRAVERSAL_ATTEMPT = "PATH_TRAVERSAL_ATTEMPT",


  // System events
  CONFIGURATION_CHANGE = "CONFIGURATION_CHANGE",
  ERROR = "ERROR",
}

export enum SecuritySeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

class SecurityLogger {
  /**
   * Log a security event
   */
  log(event: Omit<SecurityEvent, "timestamp">): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };

    // In production, this should be sent to a security monitoring system
    // For development, we'll log to console with appropriate formatting
    this.writeLog(fullEvent);


    // Send alerts for high-severity events
    if (
      fullEvent.severity === SecuritySeverity.HIGH ||
      fullEvent.severity === SecuritySeverity.CRITICAL
    ) {
      this.sendAlert(fullEvent);
    }
  }

  /**
   * Log authentication events
   */
  logAuth(
    type: SecurityEventType,
    userId?: string,
    ip?: string,
    userAgent?: string,
    metadata?: Record<string, unknown>
  ): void {
    this.log({
      type,

      severity:
        type === SecurityEventType.LOGIN_FAILURE
          ? SecuritySeverity.MEDIUM
          : SecuritySeverity.LOW,
      message: this.getEventMessage(type),
      userId,
      ip,
      userAgent,
      metadata,
    });
  }

  /**
   * Log security violations
   */
  logViolation(
    type: SecurityEventType,
    message: string,
    ip?: string,
    userAgent?: string,
    metadata?: Record<string, unknown>
  ): void {
    this.log({
      type,
      severity: this.getViolationSeverity(type),
      message,
      ip,
      userAgent,
      metadata,
    });
  }

  /**
   * Log errors with security implications
   */
  logError(
    message: string,
    error: Error,
    metadata?: Record<string, unknown>
  ): void {
    this.log({
      type: SecurityEventType.ERROR,
      severity: SecuritySeverity.MEDIUM,
      message,
      metadata: {
        ...metadata,
        error: error.message,
        stack: error.stack,
      },
    });
  }

  private writeLog(event: SecurityEvent): void {
    const logEntry = {
      timestamp: event.timestamp.toISOString(),
      type: event.type,
      severity: event.severity,
      message: event.message,
      userId: event.userId,
      ip: event.ip,
      userAgent: event.userAgent,
      metadata: event.metadata,
    };

    // Color code by severity for development
    const colorCode = this.getSeverityColor(event.severity);

    if (typeof console !== "undefined") {
      console.log(
        `${colorCode}[SECURITY] ${JSON.stringify(logEntry, null, 2)}\x1b[0m`
      );
    }
  }

  private sendAlert(event: SecurityEvent): void {
    // In production, this should integrate with alerting systems like:
    // - Email notifications
    // - Slack/Teams webhooks
    // - PagerDuty
    // - Security Information and Event Management (SIEM) systems


    console.error(`🚨 SECURITY ALERT: ${event.type} - ${event.message}`);
  }

  private getEventMessage(type: SecurityEventType): string {
    const messages = {
      [SecurityEventType.LOGIN_SUCCESS]: "User logged in successfully",
      [SecurityEventType.LOGIN_FAILURE]: "Login attempt failed",
      [SecurityEventType.LOGOUT]: "User logged out",
      [SecurityEventType.REGISTRATION]: "New user registered",
      [SecurityEventType.PASSWORD_CHANGE]: "Password changed",
      [SecurityEventType.ACCESS_DENIED]: "Access denied to protected resource",

      [SecurityEventType.PRIVILEGE_ESCALATION_ATTEMPT]:
        "Attempted privilege escalation",
      [SecurityEventType.RATE_LIMIT_EXCEEDED]: "Rate limit exceeded",
      [SecurityEventType.SUSPICIOUS_REQUEST]: "Suspicious request detected",
      [SecurityEventType.FILE_UPLOAD_VIOLATION]:
        "File upload security violation",
      [SecurityEventType.XSS_ATTEMPT]: "XSS attack attempt detected",
      [SecurityEventType.SQL_INJECTION_ATTEMPT]:
        "SQL injection attempt detected",
      [SecurityEventType.PATH_TRAVERSAL_ATTEMPT]:
        "Path traversal attempt detected",
      [SecurityEventType.CONFIGURATION_CHANGE]:
        "Security configuration changed",
      [SecurityEventType.ERROR]: "Security-related error occurred",
    };

    return messages[type] || "Unknown security event";
  }

  private getViolationSeverity(type: SecurityEventType): SecuritySeverity {
    const severityMap = {
      [SecurityEventType.RATE_LIMIT_EXCEEDED]: SecuritySeverity.MEDIUM,
      [SecurityEventType.SUSPICIOUS_REQUEST]: SecuritySeverity.HIGH,
      [SecurityEventType.FILE_UPLOAD_VIOLATION]: SecuritySeverity.HIGH,
      [SecurityEventType.XSS_ATTEMPT]: SecuritySeverity.HIGH,
      [SecurityEventType.SQL_INJECTION_ATTEMPT]: SecuritySeverity.CRITICAL,
      [SecurityEventType.PATH_TRAVERSAL_ATTEMPT]: SecuritySeverity.HIGH,

      [SecurityEventType.PRIVILEGE_ESCALATION_ATTEMPT]:
        SecuritySeverity.CRITICAL,
      [SecurityEventType.ACCESS_DENIED]: SecuritySeverity.MEDIUM,
    };

    return severityMap[type] || SecuritySeverity.MEDIUM;
  }

  private getSeverityColor(severity: SecuritySeverity): string {
    const colors = {
      [SecuritySeverity.LOW]: "\x1b[32m", // Green
      [SecuritySeverity.MEDIUM]: "\x1b[33m", // Yellow
      [SecuritySeverity.HIGH]: "\x1b[31m", // Red
      [SecuritySeverity.CRITICAL]: "\x1b[35m", // Magenta
    };

    return colors[severity] || "\x1b[0m";
  }
}

// Export singleton instance

export const securityLogger = new SecurityLogger();
