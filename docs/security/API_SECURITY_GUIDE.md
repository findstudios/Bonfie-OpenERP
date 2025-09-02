# API Security Implementation Guide

## Overview
This document outlines the security measures implemented in the Vibe-OpenERP system to protect APIs and web resources.

## Security Headers Configuration

### Content Security Policy (CSP)
```javascript
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https://*.supabase.co;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  frame-ancestors 'none';
```

### Other Security Headers
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - Enables XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Permissions-Policy` - Restricts browser features
- `Strict-Transport-Security` (HSTS) - Forces HTTPS in production

## Rate Limiting

### Implementation
Rate limiting is implemented via Supabase Edge Functions with configurable limits per endpoint:

| Endpoint | Method | Max Requests | Time Window |
|----------|---------|-------------|-------------|
| /auth/login | POST | 5 | 5 minutes |
| /auth/register | POST | 3 | 1 hour |
| /auth/reset-password | POST | 3 | 1 hour |
| /api/students | GET | 100 | 1 minute |
| /api/students | POST | 20 | 1 minute |
| /api/enrollments | POST | 10 | 1 minute |
| /api/payments | POST | 10 | 1 minute |
| /api/* | * | 200 | 1 minute |

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200000
Retry-After: 60 (when rate limit exceeded)
```

## API Key Management

### API Key Structure
- **Format**: 32+ character random string
- **Storage**: SHA-256 hashed in database
- **Permissions**: Granular permission system
- **Rate Limit Tiers**: basic, standard, premium, unlimited

### API Key Usage
```javascript
// Include API key in request header
headers: {
  'x-api-key': 'your-api-key-here'
}
```

### Request Signature (Optional)
For enhanced security, implement request signing:

```javascript
// Create signature
const timestamp = Date.now()
const message = `${method}\n${path}\n${timestamp}\n${body}`
const signature = hmacSha256(message, apiKey)

// Include in headers
headers: {
  'x-api-key': 'your-api-key',
  'x-api-signature': signature,
  'x-api-timestamp': timestamp
}
```

## Security Monitoring

### Event Types Monitored
- `invalid_login` - Failed login attempts
- `invalid_api_key` - Invalid API key usage
- `rate_limit_exceeded` - Rate limit violations
- `invalid_signature` - Failed signature verification
- `ip_blocked` - IP blocking events
- `security_alert` - General security alerts

### Alert Rules
| Event | Threshold | Time Window | Action |
|-------|-----------|-------------|---------|
| Failed Logins | 5 | 5 minutes | Alert & Block |
| Invalid API Keys | 10 | 10 minutes | Block |
| Rate Limit Violations | 20 | 10 minutes | Alert |
| Invalid Signatures | 5 | 5 minutes | Alert & Block |

### Automatic IP Blocking
- IPs are automatically blocked for 24 hours when thresholds are exceeded
- Manual permanent blocks can be set by administrators
- Blocked IPs receive 403 Forbidden responses

## Using the Security Middleware

### Basic Usage
```typescript
import { apiSecurity } from '@/middleware/apiSecurity'

// Check rate limit
const rateLimitResult = await apiSecurity.checkRateLimit('/api/students', 'GET')
if (!rateLimitResult.allowed) {
  throw new Error(`Rate limit exceeded. Retry after ${rateLimitResult.retryAfter} seconds`)
}

// Validate API key
const validation = await apiSecurity.validateApiKey(apiKey)
if (!validation.valid) {
  throw new Error('Invalid API key')
}

// Make secure API call
const response = await apiSecurity.secureFetch('https://api.example.com/data', {
  method: 'POST',
  body: JSON.stringify(data),
  apiKey: 'your-api-key'
})
```

### Logging Security Events
```typescript
await apiSecurity.logSecurityEvent(
  'suspicious_activity',
  'warning',
  {
    action: 'Multiple failed login attempts',
    ip: clientIp,
    userAgent: navigator.userAgent
  }
)
```

## Best Practices

### For Frontend Development
1. Always use the `secureFetch` wrapper for API calls
2. Store API keys securely (never in code)
3. Implement proper error handling for rate limits
4. Monitor security events dashboard regularly

### For API Integration
1. Use API keys for all external integrations
2. Implement request signing for sensitive operations
3. Respect rate limits and implement exponential backoff
4. Monitor API usage and adjust limits as needed

### Security Checklist
- [ ] Enable all security headers in production
- [ ] Configure appropriate rate limits per endpoint
- [ ] Set up API key rotation policy
- [ ] Monitor security events regularly
- [ ] Review and update blocked IPs
- [ ] Test rate limiting behavior
- [ ] Implement request signing for sensitive APIs
- [ ] Set up alerts for critical security events

## Troubleshooting

### Common Issues

1. **Rate Limit Exceeded**
   - Check current limits in response headers
   - Implement retry logic with exponential backoff
   - Consider upgrading API key tier if needed

2. **API Key Not Working**
   - Verify key is active and not expired
   - Check permissions match required endpoint
   - Ensure proper header format

3. **IP Blocked**
   - Review security events for blocking reason
   - Contact admin for manual unblock if needed
   - Implement better error handling to prevent violations

### Debug Headers
When debugging is enabled, additional headers are returned:
- `X-Debug-Request-Id`: Unique request identifier
- `X-Debug-Rate-Limit-Key`: Rate limit key used
- `X-Debug-Api-Key-Id`: API key identifier (not the key itself)

## Security Incident Response

### Immediate Actions
1. Review security events log
2. Identify affected resources
3. Block malicious IPs if needed
4. Rotate compromised API keys
5. Notify affected users if required

### Post-Incident
1. Analyze attack patterns
2. Update security rules
3. Implement additional protections
4. Document lessons learned
5. Update this guide as needed