# Security Configuration Guide

This document outlines the security measures implemented in the College Connect application and provides guidance for maintaining security best practices.

## 🔐 Security Features Implemented

### 1. Authentication & Authorization

#### Password Security
- **Strong Password Requirements**: Minimum 8 characters with uppercase, lowercase, numbers, and special characters
- **PBKDF2 Hashing**: Passwords are hashed using PBKDF2 with SHA-256 and 100,000 iterations
- **Timing-Safe Comparison**: Password verification uses constant-time comparison to prevent timing attacks
- **Salt Generation**: Cryptographically secure random salts for each password

#### Session Management
- **NextAuth v5**: Industry-standard authentication library with JWT strategy
- **Session Expiry**: 30-day session timeout with automatic renewal
- **Role-Based Access Control (RBAC)**: Granular permissions based on user roles

### 2. Security Headers

The application implements comprehensive security headers via middleware:

- **Content Security Policy (CSP)**: Prevents XSS attacks
- **Strict Transport Security (HSTS)**: Forces HTTPS connections
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-XSS-Protection**: Browser XSS filtering
- **Referrer Policy**: Controls referrer information leakage
- **Permissions Policy**: Restricts browser feature access

### 3. Rate Limiting

- **Request Rate Limiting**: 100 requests per 15-minute window per IP
- **Security Event Logging**: Rate limit violations are logged and monitored
- **Configurable Limits**: Different limits can be applied to different endpoints

### 4. File Upload Security

#### Validation
- **File Type Validation**: Strict MIME type checking
- **Extension Validation**: Cross-reference file extensions with MIME types
- **Size Limits**: Configurable maximum file sizes (default 5MB)
- **Dangerous Extension Blocking**: Executable and script files are prohibited

#### Security Measures
- **Path Traversal Prevention**: Filename sanitization and validation
- **Double Extension Detection**: Prevents bypass attempts
- **Null Byte Detection**: Prevents directory traversal attacks
- **Secure File Naming**: UUIDs prevent filename collision and guessing

### 5. Input Validation

- **Zod Schema Validation**: All inputs are validated against strict schemas
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **XSS Prevention**: Input sanitization and output encoding

### 6. Security Monitoring

#### Event Logging
- **Authentication Events**: Login/logout tracking
- **Security Violations**: Rate limiting, file upload violations
- **Access Control**: Unauthorized access attempts
- **System Events**: Configuration changes and errors

#### Alerting
- **High-Severity Alerts**: Automatic alerts for critical security events
- **Monitoring**: Comprehensive logging for security analysis

## 🚨 Environment Security

### Required Environment Variables

```bash
# Authentication (CRITICAL)
AUTH_SECRET="your-super-secret-for-auth"  # MUST be changed from default!
AUTH_URL="https://yourdomain.com"         # Use HTTPS in production

# Database
DATABASE_URL="postgresql://user:pass@host:port/db"
DIRECT_URL="postgresql://user:pass@host:port/db"

# MinIO Storage (CHANGE DEFAULTS!)
MINIO_ROOT_USER="your-admin-user"         # Change from default!
MINIO_ROOT_PASSWORD="your-secure-password" # Change from default!
AWS_ACCESS_KEY_ID="your-access-key"       # Change from default!
AWS_SECRET_ACCESS_KEY="your-secret-key"   # Change from default!
```

### Security Warnings

⚠️ **CRITICAL**: Change all default credentials before deployment!

The application will check for insecure defaults and:
- Show warnings in development
- Exit with error in production if insecure defaults are detected

## 🛡️ Deployment Security

### Docker Security
- **Non-root User**: Application runs as non-root user (nextjs:1001)
- **Multi-stage Build**: Minimizes attack surface
- **Security Updates**: Keep base images updated

### HTTPS Configuration
- **Force HTTPS**: HSTS headers force secure connections
- **Certificate Management**: Use proper SSL/TLS certificates
- **Secure Cookies**: Session cookies are secure and httpOnly

## 📊 Security Monitoring Dashboard

### Key Metrics to Monitor
1. **Failed Login Attempts**: Multiple failures from same IP
2. **Rate Limit Violations**: Unusual request patterns
3. **File Upload Violations**: Malicious upload attempts
4. **Path Traversal Attempts**: Directory traversal attacks
5. **XSS/Injection Attempts**: Script injection attempts

### Log Analysis
Security events are logged in structured JSON format:
```json
{
  "timestamp": "2023-12-07T10:30:00.000Z",
  "type": "LOGIN_FAILURE",
  "severity": "MEDIUM",
  "message": "Login attempt failed",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "metadata": {
    "email": "user@example.com",
    "reason": "invalid_credentials"
  }
}
```

## 🔧 Security Maintenance

### Regular Tasks
1. **Update Dependencies**: Run `pnpm audit` weekly
2. **Review Logs**: Check security logs daily
3. **Certificate Renewal**: Monitor SSL certificate expiry
4. **Password Policy**: Ensure strong password requirements
5. **Access Review**: Regular user access audits

### Security Testing
1. **Penetration Testing**: Annual security assessments
2. **Vulnerability Scanning**: Automated dependency scanning
3. **Code Review**: Security-focused code reviews
4. **Load Testing**: Rate limiting effectiveness

## 📋 Security Checklist

### Pre-Deployment
- [ ] Change all default credentials
- [ ] Enable HTTPS with valid certificates
- [ ] Configure proper environment variables
- [ ] Set up security monitoring
- [ ] Review CORS settings
- [ ] Test rate limiting
- [ ] Validate file upload restrictions

### Post-Deployment
- [ ] Monitor security logs
- [ ] Set up alerting
- [ ] Verify security headers
- [ ] Test authentication flows
- [ ] Check error handling
- [ ] Validate backup procedures

## 🚨 Incident Response

### Security Incident Procedure
1. **Detection**: Automated alerts or manual discovery
2. **Assessment**: Determine scope and impact
3. **Containment**: Limit exposure and prevent spread
4. **Investigation**: Analyze logs and determine cause
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Update security measures

### Emergency Contacts
- **Security Team**: security@yourdomain.com
- **Development Team**: dev@yourdomain.com
- **System Administrator**: admin@yourdomain.com

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#security)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [Docker Security](https://docs.docker.com/engine/security/)

---

**Last Updated**: December 2023  
**Version**: 1.0  
**Review Frequency**: Quarterly