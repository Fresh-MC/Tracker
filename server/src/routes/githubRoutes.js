import express from 'express';
import { protect } from '../middleware/auth.js';
import githubRateLimit from '../middleware/githubRateLimit.js';
import * as githubController from '../controllers/githubController.js';

const router = express.Router();

/**
 * GitHub Data Routes
 * All routes require authentication
 * Sync routes have additional rate limiting (10 requests per 15 minutes)
 */

// @route   GET /api/github/sync
// @desc    Sync GitHub stats for authenticated user
// @access  Private + Rate Limited
router.get('/sync', protect, githubRateLimit, githubController.syncGitHubStats);

// @route   GET /api/github/repos
// @desc    Get user's GitHub repositories
// @access  Private
router.get('/repos', protect, githubController.getUserRepos);

// @route   GET /api/github/stats
// @desc    Get cached GitHub stats for authenticated user
// @access  Private
router.get('/stats', protect, githubController.getGitHubStats);

export default router;
