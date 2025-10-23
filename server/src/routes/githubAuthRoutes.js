import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = express.Router();

/**
 * @route   GET /api/auth/github
 * @desc    Redirect to GitHub for authentication
 * @access  Public
 */
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

/**
 * @route   GET /api/auth/github/callback
 * @desc    GitHub callback URL
 * @access  Public
 */
router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: '/login?error=github_auth_failed' }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign(
        { 
          id: req.user._id, 
          role: req.user.role,
          email: req.user.email,
          username: req.user.username
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Get frontend URL from env or default
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5174';

      // Redirect to frontend with token
      res.redirect(`${frontendURL}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('❌ GitHub callback error:', error);
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5174';
      res.redirect(`${frontendURL}/login?error=token_generation_failed`);
    }
  }
);

/**
 * @route   GET /api/auth/logout
 * @desc    Logout user (clear session)
 * @access  Public
 */
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

/**
 * @route   GET /api/auth/status
 * @desc    Check authentication status
 * @access  Public
 */
router.get('/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ 
      success: true, 
      authenticated: true, 
      user: req.user.toPublicJSON() 
    });
  } else {
    res.json({ 
      success: true, 
      authenticated: false 
    });
  }
});

export default router;
