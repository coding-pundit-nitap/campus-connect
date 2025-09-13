/**
 * Security Event Logging and Monitoring Module
 * Provides comprehensive security event tracking and alerting
 */

export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecuritySeverity;
  message: string;
  metadata?: Record<string, unknown>;
  user_id?: string;
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
  CSRF_VIOLATION = "CSRF_VIOLATION",

  // System events
  CONFIGURATION_CHANGE = "CONFIGURATION_CHANGE",
  ERROR = "ERROR",

  // New event types for enhanced monitoring
  BRUTE_FORCE_ATTEMPT = "BRUTE_FORCE_ATTEMPT",
  ACCOUNT_LOCKOUT = "ACCOUNT_LOCKOUT",
  SUSPICIOUS_IP = "SUSPICIOUS_IP",
  MALFORMED_REQUEST = "MALFORMED_REQUEST",
}

export enum SecuritySeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface SecurityAlert {
  event: SecurityEvent;
  alertChannels: AlertChannel[];
  escalationLevel: number;
}

export enum AlertChannel {
  CONSOLE = "CONSOLE",
  EMAIL = "EMAIL",
  SLACK = "SLACK",
  WEBHOOK = "WEBHOOK",
  SIEM = "SIEM",
}

class SecurityLogger {
  private eventBuffer: SecurityEvent[] = [];
  private readonly bufferSize = 1000;
  private readonly alertThresholds = new Map<SecurityEventType, number>();

  constructor() {
    // Set up alert thresholds (events per minute)
    this.alertThresholds.set(SecurityEventType.LOGIN_FAILURE, 5);
    this.alertThresholds.set(SecurityEventType.RATE_LIMIT_EXCEEDED, 10);
    this.alertThresholds.set(SecurityEventType.SUSPICIOUS_REQUEST, 3);
    this.alertThresholds.set(SecurityEventType.BRUTE_FORCE_ATTEMPT, 1);
  }

  /**
   * Log a security event
   */
  log(event: Omit<SecurityEvent, "timestamp">): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };

    // Add to buffer
    this.addToBuffer(fullEvent);

    // Write log entry
    this.writeLog(fullEvent);

    // Check for alerts
    this.checkForAlerts(fullEvent);

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
    user_id?: string,
    ip?: string,
    userAgent?: string,
    metadata?: Record<string, unknown>
  ): void {
    this.log({
      type,
      severity: this.getAuthEventSeverity(type),
      message: this.getEventMessage(type),
      user_id,
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

  /**
   * Get security events within a time range
   */
  getEvents(
    startTime: Date,
    endTime: Date,
    eventType?: SecurityEventType
  ): SecurityEvent[] {
    return this.eventBuffer.filter((event) => {
      const inTimeRange =
        event.timestamp >= startTime && event.timestamp <= endTime;
      const matchesType = !eventType || event.type === eventType;
      return inTimeRange && matchesType;
    });
  }

  /**
   * Get security metrics
   */
  getMetrics(timeWindow: number = 3600000): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    topIPs: Array<{ ip: string; count: number }>;
  } {
    const cutoff = new Date(Date.now() - timeWindow);
    const recentEvents = this.eventBuffer.filter(
      (event) => event.timestamp >= cutoff
    );

    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const ipCounts: Record<string, number> = {};

    recentEvents.forEach((event) => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] =
        (eventsBySeverity[event.severity] || 0) + 1;

      if (event.ip) {
        ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1;
      }
    });

    const topIPs = Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsBySeverity,
      topIPs,
    };
  }

  private addToBuffer(event: SecurityEvent): void {
    this.eventBuffer.push(event);

    // Keep buffer size manageable
    if (this.eventBuffer.length > this.bufferSize) {
      this.eventBuffer = this.eventBuffer.slice(-this.bufferSize);
    }
  }

  private writeLog(event: SecurityEvent): void {
    const logEntry = {
      timestamp: event.timestamp.toISOString(),
      type: event.type,
      severity: event.severity,
      message: event.message,
      user_id: event.user_id,
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

    // In production, send to logging service (e.g., Datadog, Splunk, ELK stack)
    this.sendToExternalLogger(logEntry);
  }

  private sendAlert(event: SecurityEvent): void {
    // In production, this should integrate with alerting systems like:
    // - Email notifications
    // - Slack/Teams webhooks
    // - PagerDuty
    // - Security Information and Event Management (SIEM) systems

    console.error(`🚨 SECURITY ALERT: ${event.type} - ${event.message}`);

    // Send to external alerting systems
    this.sendToAlertingSystem({
      event,
      alertChannels: this.getAlertChannels(event.severity),
      escalationLevel: this.getEscalationLevel(event.severity),
    });
  }

  private checkForAlerts(event: SecurityEvent): void {
    const threshold = this.alertThresholds.get(event.type);
    if (!threshold) return;

    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentEvents = this.getEvents(oneMinuteAgo, new Date(), event.type);

    if (recentEvents.length >= threshold) {
      this.log({
        type: SecurityEventType.SUSPICIOUS_REQUEST,
        severity: SecuritySeverity.HIGH,
        message: `High frequency of ${event.type} events detected`,
        ip: event.ip,
        metadata: {
          eventType: event.type,
          eventCount: recentEvents.length,
          threshold,
          timeWindow: "1 minute",
        },
      });
    }
  }

  private getAuthEventSeverity(type: SecurityEventType): SecuritySeverity {
    switch (type) {
      case SecurityEventType.LOGIN_FAILURE:
        return SecuritySeverity.MEDIUM;
      case SecurityEventType.BRUTE_FORCE_ATTEMPT:
        return SecuritySeverity.HIGH;
      case SecurityEventType.ACCOUNT_LOCKOUT:
        return SecuritySeverity.HIGH;
      default:
        return SecuritySeverity.LOW;
    }
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
      [SecurityEventType.CSRF_VIOLATION]: "CSRF token validation failed",
      [SecurityEventType.CONFIGURATION_CHANGE]:
        "Security configuration changed",
      [SecurityEventType.ERROR]: "Security-related error occurred",
      [SecurityEventType.BRUTE_FORCE_ATTEMPT]: "Brute force attack detected",
      [SecurityEventType.ACCOUNT_LOCKOUT]:
        "Account locked due to suspicious activity",
      [SecurityEventType.SUSPICIOUS_IP]: "Request from suspicious IP address",
      [SecurityEventType.MALFORMED_REQUEST]: "Malformed request detected",
    };

    return messages[type] || "Unknown security event";
  }

  private getViolationSeverity(type: SecurityEventType): SecuritySeverity {
    const severityMap: Record<SecurityEventType, SecuritySeverity> = {
      [SecurityEventType.LOGIN_SUCCESS]: SecuritySeverity.LOW,
      [SecurityEventType.LOGIN_FAILURE]: SecuritySeverity.MEDIUM,
      [SecurityEventType.LOGOUT]: SecuritySeverity.LOW,
      [SecurityEventType.REGISTRATION]: SecuritySeverity.LOW,
      [SecurityEventType.PASSWORD_CHANGE]: SecuritySeverity.LOW,
      [SecurityEventType.ACCESS_DENIED]: SecuritySeverity.MEDIUM,
      [SecurityEventType.PRIVILEGE_ESCALATION_ATTEMPT]:
        SecuritySeverity.CRITICAL,
      [SecurityEventType.RATE_LIMIT_EXCEEDED]: SecuritySeverity.MEDIUM,
      [SecurityEventType.SUSPICIOUS_REQUEST]: SecuritySeverity.HIGH,
      [SecurityEventType.FILE_UPLOAD_VIOLATION]: SecuritySeverity.HIGH,
      [SecurityEventType.XSS_ATTEMPT]: SecuritySeverity.HIGH,
      [SecurityEventType.SQL_INJECTION_ATTEMPT]: SecuritySeverity.CRITICAL,
      [SecurityEventType.PATH_TRAVERSAL_ATTEMPT]: SecuritySeverity.HIGH,
      [SecurityEventType.CSRF_VIOLATION]: SecuritySeverity.HIGH,
      [SecurityEventType.CONFIGURATION_CHANGE]: SecuritySeverity.MEDIUM,
      [SecurityEventType.ERROR]: SecuritySeverity.MEDIUM,
      [SecurityEventType.BRUTE_FORCE_ATTEMPT]: SecuritySeverity.CRITICAL,
      [SecurityEventType.ACCOUNT_LOCKOUT]: SecuritySeverity.HIGH,
      [SecurityEventType.SUSPICIOUS_IP]: SecuritySeverity.MEDIUM,
      [SecurityEventType.MALFORMED_REQUEST]: SecuritySeverity.MEDIUM,
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

  private getAlertChannels(severity: SecuritySeverity): AlertChannel[] {
    switch (severity) {
      case SecuritySeverity.CRITICAL:
        return [
          AlertChannel.CONSOLE,
          AlertChannel.EMAIL,
          AlertChannel.SLACK,
          AlertChannel.SIEM,
        ];
      case SecuritySeverity.HIGH:
        return [AlertChannel.CONSOLE, AlertChannel.SLACK, AlertChannel.SIEM];
      case SecuritySeverity.MEDIUM:
        return [AlertChannel.CONSOLE, AlertChannel.SIEM];
      default:
        return [AlertChannel.CONSOLE];
    }
  }

  private getEscalationLevel(severity: SecuritySeverity): number {
    switch (severity) {
      case SecuritySeverity.CRITICAL:
        return 3;
      case SecuritySeverity.HIGH:
        return 2;
      case SecuritySeverity.MEDIUM:
        return 1;
      default:
        return 0;
    }
  }

  private sendToExternalLogger(_logEntry: unknown): void {
    // In production, implement integration with:
    // - Datadog: https://docs.datadoghq.com/logs/
    // - Splunk: https://docs.splunk.com/Documentation/SplunkCloud/latest/Data/UsetheHTTPEventCollector
    // - ELK Stack: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/index.html
    // - New Relic: https://docs.newrelic.com/docs/logs/forward-logs/forward-your-logs-using-infrastructure-agent/
  }

  private sendToAlertingSystem(_alert: SecurityAlert): void {
    // In production, implement integration with:
    // - PagerDuty: https://developer.pagerduty.com/docs/ZG9jOjExMDI5NTUz-events-api-v2
    // - Slack: https://api.slack.com/messaging/webhooks
    // - Email services: SendGrid, AWS SES, etc.
    // - Custom webhook endpoints
  }
}

// Export singleton instance
export const securityLogger = new SecurityLogger();
