import { Request, Response, NextFunction } from 'express'
import { validateAccessToken } from '../utils'

// Middleware to validate access tokens
export function requireAccessToken(req: Request, res: Response, next: NextFunction) {
  const accessToken = req.query.access_token as string || req.body.accessToken as string

  if (!accessToken || !validateAccessToken(accessToken)) {
    return res.status(401).json({ 
      error: 'Access token is required and must be valid' 
    })
  }

  // Attach token to request for use in route handlers
  req.accessToken = accessToken
  next()
}

// Middleware to validate request body
export function validateRequestBody(requiredFields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields = requiredFields.filter(field => !req.body[field])
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields
      })
    }
    
    next()
  }
}

// Extend Express Request type to include accessToken
declare global {
  namespace Express {
    interface Request {
      accessToken?: string
    }
  }
}
