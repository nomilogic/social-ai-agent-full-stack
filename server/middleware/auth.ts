import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'dev-secret', (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email
    };
    next();
  });
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET || 'dev-secret', (err: any, decoded: any) => {
      if (!err && decoded) {
        req.user = {
          id: decoded.id,
          email: decoded.email
        };
      }
    });
  }
  next();
};

// Aliases for compatibility
export const authenticateUser = authenticateToken;

// Validation middleware for request body
export const validateRequestBody = (requiredFields: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }
    next();
  };
};