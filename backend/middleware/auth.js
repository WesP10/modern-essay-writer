import { auth } from '../config/firebase.js';
import { AuthenticationError } from './errorHandler.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware to verify JWT token from Firebase
 */
export async function authenticateUser(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No authentication token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Firebase
    const decodedToken = await auth.verifyIdToken(token);

    if (!decodedToken) {
      logger.warn('Authentication failed: Invalid token');
      throw new AuthenticationError('Invalid or expired token');
    }

    // Attach user to request object
    req.user = {
      id: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
      name: decodedToken.name || null
    };
    req.userId = decodedToken.uid;

    logger.debug(`User authenticated: ${decodedToken.uid}`);
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: error.message
      });
    }
    
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication check failed'
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token provided
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      req.userId = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decodedToken = await auth.verifyIdToken(token);

    if (decodedToken) {
      req.user = {
        id: decodedToken.uid,
        email: decodedToken.email,
        email_verified: decodedToken.email_verified,
        name: decodedToken.name || null
      };
      req.userId = decodedToken.uid;
    } else {
      req.user = null;
      req.userId = null;
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    req.user = null;
    req.userId = null;
    next();
  }
}

/**
 * Middleware to require admin privileges
 * Checks Firebase custom claims for admin role
 */
export async function requireAdmin(req, res, next) {
  try {
    // Ensure user is authenticated first
    if (!req.userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Get user record to check custom claims
    const userRecord = await auth.getUser(req.userId);
    
    // Check for admin claim
    const isAdmin = userRecord.customClaims?.admin === true;

    if (!isAdmin) {
      logger.warn(`Admin access denied for user ${req.userId}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin privileges required',
      });
    }

    // Attach admin status to request
    req.isAdmin = true;
    logger.info(`Admin access granted for user ${req.userId}`);
    
    next();
  } catch (error) {
    logger.error('Admin check middleware error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify admin status',
    });
  }
}

export default authenticateUser;
