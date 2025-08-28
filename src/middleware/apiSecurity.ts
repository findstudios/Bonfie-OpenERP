import { supabase } from '@/services/supabase'

interface SecurityMiddlewareOptions {
  checkRateLimit?: boolean
  requireApiKey?: boolean
  requireAuth?: boolean
}

export class ApiSecurityMiddleware {
  private static instance: ApiSecurityMiddleware

  private constructor() {}

  static getInstance(): ApiSecurityMiddleware {
    if (!ApiSecurityMiddleware.instance) {
      ApiSecurityMiddleware.instance = new ApiSecurityMiddleware()
    }
    return ApiSecurityMiddleware.instance
  }

  /**
   * Check if IP is blocked
   */
  async checkIpBlock(ip: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('blocked_ips')
        .select('id')
        .eq('ip_address', ip)
        .or(`is_permanent.eq.true,blocked_until.gt.${new Date().toISOString()}`)
        .single()

      return !!data && !error
    } catch (error) {
      console.error('Error checking IP block:', error)
      return false
    }
  }

  /**
   * Check rate limit via Edge Function
   */
  async checkRateLimit(endpoint: string, method: string): Promise<{
    allowed: boolean
    limit?: number
    remaining?: number
    reset?: number
    retryAfter?: number
  }> {
    try {
      const response = await supabase.functions.invoke('rate-limiter', {
        body: { endpoint, method }
      })

      if (response.error) {
        console.error('Rate limit check error:', response.error)
        return { allowed: true } // Allow on error
      }

      return response.data
    } catch (error) {
      console.error('Rate limit check error:', error)
      return { allowed: true } // Allow on error
    }
  }

  /**
   * Validate API key via Edge Function
   */
  async validateApiKey(apiKey: string, signature?: string, timestamp?: string): Promise<{
    valid: boolean
    keyId?: string
    clientName?: string
    permissions?: string[]
    rateLimitTier?: string
  }> {
    try {
      const headers: Record<string, string> = {
        'x-api-key': apiKey
      }

      if (signature) {
        headers['x-api-signature'] = signature
      }

      if (timestamp) {
        headers['x-api-timestamp'] = timestamp
      }

      const response = await supabase.functions.invoke('api-key-validator', {
        headers
      })

      if (response.error) {
        console.error('API key validation error:', response.error)
        return { valid: false }
      }

      return response.data
    } catch (error) {
      console.error('API key validation error:', error)
      return { valid: false }
    }
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    eventType: string,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info',
    metadata?: any
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('security_events')
        .insert({
          event_type: eventType,
          severity,
          user_id: (await supabase.auth.getUser()).data?.user?.id,
          user_agent: navigator.userAgent,
          metadata
        })

      if (error) {
        console.error('Failed to log security event:', error)
      }
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }

  /**
   * Create request signature for API calls
   */
  createRequestSignature(
    method: string,
    path: string,
    body: string,
    apiKey: string,
    timestamp: number
  ): string {
    const message = `${method}\n${path}\n${timestamp}\n${body}`
    return this.hmacSha256(message, apiKey)
  }

  /**
   * HMAC-SHA256 implementation
   */
  private async hmacSha256(message: string, key: string): Promise<string> {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(key)
    const messageData = encoder.encode(message)

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)

    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  /**
   * Wrap fetch with security checks
   */
  async secureFetch(
    url: string,
    options: RequestInit & {
      apiKey?: string,
      skipRateLimit?: boolean,
      skipApiKey?: boolean
    } = {}
  ): Promise<Response> {
    const { apiKey, skipRateLimit, skipApiKey, ...fetchOptions } = options

    // Parse URL
    const urlObj = new URL(url)
    const path = urlObj.pathname
    const method = fetchOptions.method || 'GET'

    // Check rate limit
    if (!skipRateLimit) {
      const rateLimitResult = await this.checkRateLimit(path, method)
      if (!rateLimitResult.allowed) {
        throw new Error(`Rate limit exceeded. Retry after ${rateLimitResult.retryAfter} seconds`)
      }
    }

    // Add API key if provided
    if (apiKey && !skipApiKey) {
      const timestamp = Date.now()
      const body = fetchOptions.body?.toString() || ''
      const signature = await this.createRequestSignature(method, path, body, apiKey, timestamp)

      fetchOptions.headers = {
        ...fetchOptions.headers,
        'x-api-key': apiKey,
        'x-api-signature': signature,
        'x-api-timestamp': timestamp.toString()
      }
    }

    // Add security headers
    fetchOptions.headers = {
      ...fetchOptions.headers,
      'X-Requested-With': 'XMLHttpRequest',
      'X-Client-Version': '1.0.0'
    }

    try {
      const response = await fetch(url, fetchOptions)

      // Log suspicious responses
      if (response.status === 403 || response.status === 401) {
        await this.logSecurityEvent('suspicious_response', 'warning', {
          url: path,
          method,
          status: response.status
        })
      }

      return response
    } catch (error) {
      await this.logSecurityEvent('fetch_error', 'error', {
        url: path,
        method,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Initialize security monitoring
   */
  async initializeMonitoring(): Promise<void> {
    // Set up periodic security check
    setInterval(async () => {
      try {
        const response = await supabase.functions.invoke('security-monitor')
        if (response.data?.alerts_triggered > 0) {
          console.warn('Security alerts triggered:', response.data.alerts)
        }
      } catch (error) {
        console.error('Security monitoring error:', error)
      }
    }, 5 * 60 * 1000) // Check every 5 minutes
  }
}

// Export singleton instance
export const apiSecurity = ApiSecurityMiddleware.getInstance()
