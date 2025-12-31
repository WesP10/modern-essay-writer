import { redisClient } from '../config/redis.js';
import { logger } from '../utils/logger.js';

const REDIS_TOKEN_INIT = parseInt(process.env.REDIS_TOKEN_INIT || '1000', 10);
const REDIS_RATE_LIMIT_MINUTE = parseInt(process.env.REDIS_RATE_LIMIT_MINUTE || '10', 10);
const REDIS_RATE_LIMIT_HOUR = parseInt(process.env.REDIS_RATE_LIMIT_HOUR || '50', 10);
const REDIS_SESSION_TTL = parseInt(process.env.REDIS_SESSION_TTL || '86400', 10); // 24 hours

// Token costs per service
const TOKEN_COSTS = {
  generation: parseInt(process.env.OLLAMA_GENERATOR_TOKENS || '10', 10),
  humanizer: parseInt(process.env.OLLAMA_HUMANIZER_TOKENS || '5', 10),
  detector: parseInt(process.env.OLLAMA_DETECTOR_TOKENS || '3', 10),
  citations: parseInt(process.env.OLLAMA_CITATION_TOKENS || '5', 10),
};

class TokenService {
  /**
   * Initialize a user with starting tokens on first use
   * @param {string} userId - JWT user ID
   * @returns {Promise<number>} - Initial token count
   */
  async initializeUser(userId) {
    try {
      const client = await redisClient.connect();
      if (!client) {
        logger.warn('Redis unavailable, token tracking disabled');
        return REDIS_TOKEN_INIT;
      }

      const key = `tokens:${userId}`;
      const existing = await client.get(key);

      if (existing === null) {
        await client.set(key, REDIS_TOKEN_INIT.toString());
        logger.info(`Initialized user ${userId} with ${REDIS_TOKEN_INIT} tokens`);
        return REDIS_TOKEN_INIT;
      }

      return parseInt(existing, 10);
    } catch (error) {
      logger.error('Error initializing user tokens:', error);
      throw error;
    }
  }

  /**
   * Get remaining tokens for a user
   * @param {string} userId - JWT user ID
   * @returns {Promise<number>} - Remaining token count
   */
  async getRemainingTokens(userId) {
    try {
      const client = await redisClient.connect();
      if (!client) return REDIS_TOKEN_INIT; // Fallback when Redis unavailable

      const key = `tokens:${userId}`;
      const tokens = await client.get(key);

      if (tokens === null) {
        return await this.initializeUser(userId);
      }

      return parseInt(tokens, 10);
    } catch (error) {
      logger.error('Error getting remaining tokens:', error);
      return REDIS_TOKEN_INIT;
    }
  }

  /**
   * Check if user has sufficient tokens for a service
   * @param {string} userId - JWT user ID
   * @param {string} service - Service name (generation, humanizer, detector, citations)
   * @returns {Promise<{hasTokens: boolean, remaining: number, required: number}>}
   */
  async checkTokens(userId, service) {
    const required = TOKEN_COSTS[service] || 0;
    const remaining = await this.getRemainingTokens(userId);

    return {
      hasTokens: remaining >= required,
      remaining,
      required,
    };
  }

  /**
   * Deduct tokens for a service
   * @param {string} userId - JWT user ID
   * @param {string} service - Service name
   * @returns {Promise<{success: boolean, remaining: number}>}
   */
  async deductTokens(userId, service) {
    try {
      const client = await redisClient.connect();
      if (!client) {
        logger.warn('Redis unavailable, skipping token deduction');
        return { success: true, remaining: REDIS_TOKEN_INIT };
      }

      const required = TOKEN_COSTS[service] || 0;
      const key = `tokens:${userId}`;

      // Use DECRBY for atomic decrement
      const newBalance = await client.decrBy(key, required);

      if (newBalance < 0) {
        // Rollback if insufficient tokens
        await client.incrBy(key, required);
        logger.warn(`User ${userId} has insufficient tokens for ${service}`);
        return { success: false, remaining: 0 };
      }

      logger.info(`Deducted ${required} tokens from user ${userId} for ${service} (remaining: ${newBalance})`);
      return { success: true, remaining: newBalance };
    } catch (error) {
      logger.error('Error deducting tokens:', error);
      throw error;
    }
  }

  /**
   * Check rate limits for a user
   * @param {string} userId - JWT user ID
   * @returns {Promise<{limited: boolean, minute: number, hour: number}>}
   */
  async checkRateLimits(userId) {
    try {
      const client = await redisClient.connect();
      if (!client) {
        // No rate limiting without Redis
        return { limited: false, minute: 0, hour: 0 };
      }

      const minuteKey = `ratelimit:${userId}:minute`;
      const hourKey = `ratelimit:${userId}:hour`;

      const [minuteCount, hourCount] = await Promise.all([
        client.get(minuteKey),
        client.get(hourKey),
      ]);

      const minute = parseInt(minuteCount || '0', 10);
      const hour = parseInt(hourCount || '0', 10);

      const limited = minute >= REDIS_RATE_LIMIT_MINUTE || hour >= REDIS_RATE_LIMIT_HOUR;

      return { limited, minute, hour };
    } catch (error) {
      logger.error('Error checking rate limits:', error);
      return { limited: false, minute: 0, hour: 0 };
    }
  }

  /**
   * Increment rate limit counters
   * @param {string} userId - JWT user ID
   * @returns {Promise<{minute: number, hour: number}>}
   */
  async incrementRateLimits(userId) {
    try {
      const client = await redisClient.connect();
      if (!client) {
        return { minute: 0, hour: 0 };
      }

      const minuteKey = `ratelimit:${userId}:minute`;
      const hourKey = `ratelimit:${userId}:hour`;

      // Increment counters and set TTL if first request
      const [minute, hour] = await Promise.all([
        client.incr(minuteKey),
        client.incr(hourKey),
      ]);

      // Set TTL only if this is the first increment (value = 1)
      if (minute === 1) {
        await client.expire(minuteKey, 60); // 60 seconds
      }
      if (hour === 1) {
        await client.expire(hourKey, 3600); // 1 hour
      }

      return { minute, hour };
    } catch (error) {
      logger.error('Error incrementing rate limits:', error);
      return { minute: 0, hour: 0 };
    }
  }

  /**
   * Initialize or refresh user session
   * @param {string} userId - JWT user ID
   * @returns {Promise<{tokensRemaining: number, sessionActive: boolean, canUseServices: boolean}>}
   */
  async initSession(userId) {
    try {
      const client = await redisClient.connect();
      if (!client) {
        const tokens = REDIS_TOKEN_INIT;
        return { tokensRemaining: tokens, sessionActive: true, canUseServices: true };
      }

      const sessionKey = `session:${userId}`;
      const now = Date.now();

      const sessionData = {
        lastActivity: now,
        initialized: now,
      };

      // Set session with TTL
      await client.setEx(sessionKey, REDIS_SESSION_TTL, JSON.stringify(sessionData));

      // Initialize tokens if needed
      const tokensRemaining = await this.getRemainingTokens(userId);

      // Check rate limits
      const rateLimitStatus = await this.checkRateLimits(userId);
      const canUseServices = tokensRemaining > 0 && !rateLimitStatus.limited;

      logger.info(`Session initialized for user ${userId}`);
      return { tokensRemaining, sessionActive: true, canUseServices };
    } catch (error) {
      logger.error('Error initializing session:', error);
      throw error;
    }
  }

  /**
   * Refresh session activity timestamp
   * @param {string} userId - JWT user ID
   * @returns {Promise<void>}
   */
  async refreshSession(userId) {
    try {
      const client = await redisClient.connect();
      if (!client) return;

      const sessionKey = `session:${userId}`;
      const sessionStr = await client.get(sessionKey);

      if (sessionStr) {
        const sessionData = JSON.parse(sessionStr);
        sessionData.lastActivity = Date.now();
        await client.setEx(sessionKey, REDIS_SESSION_TTL, JSON.stringify(sessionData));
      }
    } catch (error) {
      logger.error('Error refreshing session:', error);
    }
  }

  /**
   * Get session status
   * @param {string} userId - JWT user ID
   * @returns {Promise<{active: boolean, lastActivity: number|null}>}
   */
  async getSessionStatus(userId) {
    try {
      const client = await redisClient.connect();
      if (!client) {
        return { active: true, lastActivity: null };
      }

      const sessionKey = `session:${userId}`;
      const sessionStr = await client.get(sessionKey);

      if (!sessionStr) {
        return { active: false, lastActivity: null };
      }

      const sessionData = JSON.parse(sessionStr);
      return {
        active: true,
        lastActivity: sessionData.lastActivity,
      };
    } catch (error) {
      logger.error('Error getting session status:', error);
      return { active: false, lastActivity: null };
    }
  }

  /**
   * Admin: Manually grant tokens to a user
   * @param {string} userId - JWT user ID
   * @param {number} amount - Tokens to add
   * @returns {Promise<{success: boolean, newBalance: number}>}
   */
  async grantTokens(userId, amount) {
    try {
      const client = await redisClient.connect();
      if (!client) {
        logger.error('Redis unavailable, cannot grant tokens');
        return { success: false, newBalance: 0 };
      }

      const key = `tokens:${userId}`;
      const newBalance = await client.incrBy(key, amount);

      logger.info(`Admin granted ${amount} tokens to user ${userId} (new balance: ${newBalance})`);
      return { success: true, newBalance };
    } catch (error) {
      logger.error('Error granting tokens:', error);
      throw error;
    }
  }

  /**
   * Admin: Reset user tokens to initial amount
   * @param {string} userId - JWT user ID
   * @returns {Promise<{success: boolean, newBalance: number}>}
   */
  async resetTokens(userId) {
    try {
      const client = await redisClient.connect();
      if (!client) {
        logger.error('Redis unavailable, cannot reset tokens');
        return { success: false, newBalance: 0 };
      }

      const key = `tokens:${userId}`;
      await client.set(key, REDIS_TOKEN_INIT.toString());

      logger.info(`Admin reset tokens for user ${userId} to ${REDIS_TOKEN_INIT}`);
      return { success: true, newBalance: REDIS_TOKEN_INIT };
    } catch (error) {
      logger.error('Error resetting tokens:', error);
      throw error;
    }
  }

  /**
   * Get full status for a user (tokens + rate limits)
   * @param {string} userId - JWT user ID
   * @returns {Promise<{tokensRemaining: number, rateLimit: {minute: number, hour: number}, canUseServices: boolean}>}
   */
  async getFullStatus(userId) {
    try {
      const [tokensRemaining, rateLimitStatus] = await Promise.all([
        this.getRemainingTokens(userId),
        this.checkRateLimits(userId),
      ]);

      return {
        tokensRemaining,
        rateLimit: {
          minute: rateLimitStatus.minute,
          hour: rateLimitStatus.hour,
        },
        canUseServices: tokensRemaining > 0 && !rateLimitStatus.limited,
      };
    } catch (error) {
      logger.error('Error getting full status:', error);
      throw error;
    }
  }
}

export const tokenService = new TokenService();
