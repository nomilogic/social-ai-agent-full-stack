import { Request, Response, NextFunction } from 'express';
import { authService, AuthUser } from '../lib/authService';

/**
 * JWT Authentication middleware
 * Verifies JWT tokens and attaches user info to request
 */
export async function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access token required. Please provide Bearer token in Authorization header.' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const user = await authService.verifyToken(token);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid or expired token. Please login again.' 
      });
    }

    // Attach user info to request for use in route handlers
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('JWT authentication error:', error);
    return res.status(401).json({ 
      error: 'Token verification failed' 
    });
  }
}

/**
 * Optional JWT Authentication middleware
 * Verifies JWT tokens but doesn't fail if no token provided
 */
export async function optionalJWT(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await authService.verifyToken(token);
      
      if (user) {
        req.user = user;
        req.token = token;
      }
    }
    
    next();
  } catch (error) {
    // Log error but don't fail the request
    console.warn('Optional JWT verification failed:', error);
    next();
  }
}

/**
 * Middleware to validate request body
 */
export function validateRequestBody(requiredFields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields = requiredFields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields
      });
    }
    
    next();
  };
}

/**
 * Middleware to check user permissions/roles
 */
export function requireRole(requiredRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.profile_type || 'individual';
    
    if (!requiredRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: requiredRoles,
        current: userRole
      });
    }
    
    next();
  };
}

/**
 * Legacy middleware for backward compatibility
 * @deprecated Use authenticateJWT instead
 */
export function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const userId = req.query.userId as string || req.body.userId as string;
  
  if (!userId) {
    return res.status(401).json({ error: 'User ID is required' });
  }
  
  // Create a minimal user object for legacy compatibility
  req.user = { id: userId } as AuthUser;
  next();
}

// Extend Express Request type to include user and token
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      token?: string;
    }
  }
}
