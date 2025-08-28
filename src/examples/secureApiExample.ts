/**
 * Secure API Usage Examples
 * This file demonstrates how to use the security features in Vibe-OpenERP
 */

import { apiSecurity } from '@/middleware/apiSecurity'
import { supabase } from '@/services/supabase'

// Example 1: Making a secure API call with rate limiting
async function fetchStudentsSecurely() {
  try {
    // The secureFetch wrapper automatically handles rate limiting
    const response = await apiSecurity.secureFetch('/api/students', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 429) {
        // Rate limit exceeded
        const retryAfter = response.headers.get('Retry-After')
        console.error(`Rate limit exceeded. Retry after ${retryAfter} seconds`)
        // Implement exponential backoff
        await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000))
        // Retry the request
        return fetchStudentsSecurely()
      }
      throw new Error(`API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to fetch students:', error)
    throw error
  }
}

// Example 2: Using API key authentication
async function fetchWithApiKey() {
  const apiKey = process.env.VITE_API_KEY // Store API key securely

  try {
    const response = await apiSecurity.secureFetch('/api/reports/monthly', {
      method: 'GET',
      apiKey // Automatically adds signature and timestamp
    })

    return await response.json()
  } catch (error) {
    console.error('API key authentication failed:', error)
    throw error
  }
}

// Example 3: Creating a new enrollment with security checks
async function createEnrollmentSecurely(enrollmentData: any) {
  try {
    // Log the action for audit purposes
    await apiSecurity.logSecurityEvent('enrollment_creation_attempt', 'info', {
      student_id: enrollmentData.student_id,
      course_id: enrollmentData.course_id
    })

    // Make the API call with rate limiting
    const response = await apiSecurity.secureFetch('/api/enrollments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(enrollmentData)
    })

    if (!response.ok) {
      // Log failed attempt
      await apiSecurity.logSecurityEvent('enrollment_creation_failed', 'warning', {
        status: response.status,
        student_id: enrollmentData.student_id
      })
      throw new Error(`Failed to create enrollment: ${response.status}`)
    }

    const result = await response.json()

    // Log successful creation
    await apiSecurity.logSecurityEvent('enrollment_created', 'info', {
      enrollment_id: result.enrollment_id
    })

    return result
  } catch (error) {
    console.error('Failed to create enrollment:', error)
    throw error
  }
}

// Example 4: Checking IP block status before making requests
async function checkAccessBeforeRequest() {
  try {
    // Get client IP (in real app, this would come from server)
    const clientIp = '192.168.1.100'

    // Check if IP is blocked
    const isBlocked = await apiSecurity.checkIpBlock(clientIp)

    if (isBlocked) {
      throw new Error('Access denied: Your IP has been blocked')
    }

    // Proceed with the request
    return await fetchStudentsSecurely()
  } catch (error) {
    console.error('Access check failed:', error)
    throw error
  }
}

// Example 5: Implementing retry logic with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  let lastError: Error

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await apiSecurity.secureFetch(url, options)

      if (response.status === 429) {
        // Rate limited - wait before retry
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60')
        const backoffTime = Math.min(retryAfter * 1000, Math.pow(2, i) * 1000)

        console.log(`Rate limited. Waiting ${backoffTime}ms before retry ${i + 1}/${maxRetries}`)
        await new Promise(resolve => setTimeout(resolve, backoffTime))
        continue
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response
    } catch (error) {
      lastError = error as Error

      if (i < maxRetries - 1) {
        // Wait before retry with exponential backoff
        const backoffTime = Math.pow(2, i) * 1000
        console.log(`Error occurred. Waiting ${backoffTime}ms before retry ${i + 1}/${maxRetries}`)
        await new Promise(resolve => setTimeout(resolve, backoffTime))
      }
    }
  }

  throw lastError!
}

// Example 6: Monitoring security events
async function setupSecurityMonitoring() {
  // Initialize security monitoring
  await apiSecurity.initializeMonitoring()

  // Set up custom alert handler
  const checkSecurityAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .eq('severity', 'critical')
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })

      if (data && data.length > 0) {
        console.error('Critical security events detected:', data)
        // Send notifications, trigger alerts, etc.
      }
    } catch (error) {
      console.error('Failed to check security alerts:', error)
    }
  }

  // Check for critical events every minute
  setInterval(checkSecurityAlerts, 60 * 1000)
}

// Example 7: Validating API key programmatically
async function validateApiKeyExample() {
  const apiKey = 'your-api-key-here'
  const timestamp = Date.now().toString()

  // Create request signature
  const method = 'GET'
  const path = '/api/students'
  const body = ''
  const signature = await apiSecurity.createRequestSignature(
    method,
    path,
    body,
    apiKey,
    parseInt(timestamp)
  )

  // Validate the API key
  const validation = await apiSecurity.validateApiKey(
    apiKey,
    signature,
    timestamp
  )

  if (!validation.valid) {
    throw new Error('Invalid API key')
  }

  console.log('API key validated:', {
    keyId: validation.keyId,
    clientName: validation.clientName,
    permissions: validation.permissions,
    rateLimitTier: validation.rateLimitTier
  })

  return validation
}

// Export example functions for use in other modules
export {
  fetchStudentsSecurely,
  fetchWithApiKey,
  createEnrollmentSecurely,
  checkAccessBeforeRequest,
  fetchWithRetry,
  setupSecurityMonitoring,
  validateApiKeyExample
}
