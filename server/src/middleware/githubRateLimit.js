import rateLimit from 'express-rate-limit';

/**
 * Rate limiting middleware specifically for GitHub API routes
 * More restrictive than general API rate limit to prevent GitHub API abuse
 */

export const githubRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each user to 10 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many GitHub sync requests. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  // Use user ID as key instead of IP (since we have authentication)
  keyGenerator: (req) => {
    return req.user?.id || req.ip; // Fall back to IP if user not authenticated
  },
  skip: (req) => {
    // Don't rate limit if user is not authenticated (will be handled by auth middleware)
    return !req.user;
  },
  handler: (req, res) => {
    console.log(`⚠️ Rate limit exceeded for user: ${req.user?.email || req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many GitHub sync requests. Please try again in 15 minutes.',
      retryAfter: '15 minutes'
    });
  }
});

export default githubRateLimit;
