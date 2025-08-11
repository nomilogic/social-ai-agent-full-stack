// Utility functions for the server

export function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function validateAccessToken(token: string): boolean {
  return !!(token && token.length > 0 && !token.includes('undefined'))
}

export function formatErrorResponse(error: any) {
  if (error.response?.data) {
    return error.response.data
  }
  if (error.message) {
    return error.message
  }
  return 'Unknown error occurred'
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, '').trim()
}

// Social media platform validation
export const SUPPORTED_PLATFORMS = ['linkedin', 'twitter', 'facebook', 'instagram', 'tiktok', 'youtube'] as const
export type SupportedPlatform = typeof SUPPORTED_PLATFORMS[number]

export function isValidPlatform(platform: string): platform is SupportedPlatform {
  return SUPPORTED_PLATFORMS.includes(platform as SupportedPlatform)
}

export function validatePlatforms(platforms: string[]): SupportedPlatform[] {
  return platforms.filter(isValidPlatform)
}
