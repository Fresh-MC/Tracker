import User from '../models/User.js';
import * as githubService from '../services/githubService.js';

/**
 * GitHub Controller
 * Handles GitHub data synchronization and retrieval
 */

/**
 * Sync GitHub stats for the authenticated user
 * @route GET /api/github/sync
 * @access Private (requires authentication)
 */
export const syncGitHubStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user with githubToken (normally excluded by select: false)
    const user = await User.findById(userId).select('+githubToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has GitHub connected
    if (!user.githubUsername || !user.githubToken) {
      return res.status(400).json({
        success: false,
        message: 'GitHub account not connected. Please login with GitHub first.'
      });
    }

    // Verify token is still valid
    const isValidToken = await githubService.verifyGitHubToken(user.githubToken);
    if (!isValidToken) {
      return res.status(401).json({
        success: false,
        message: 'GitHub token is invalid or expired. Please reconnect your GitHub account.',
        requiresReauth: true
      });
    }

    // Sync all GitHub stats
    const stats = await githubService.syncAllStats(user);

    // Update user's GitHub stats and lastSync timestamp
    user.githubStats = stats;
    user.lastSync = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'GitHub stats synced successfully',
      data: {
        githubUsername: user.githubUsername,
        githubStats: user.githubStats,
        lastSync: user.lastSync
      }
    });

  } catch (error) {
    console.error('❌ Sync GitHub Stats Error:', error);
    
    // Handle specific error messages
    if (error.message.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        message: 'GitHub API rate limit exceeded. Please try again later.'
      });
    }

    if (error.message.includes('token')) {
      return res.status(401).json({
        success: false,
        message: error.message,
        requiresReauth: true
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to sync GitHub stats',
      error: error.message
    });
  }
};

/**
 * Get user's GitHub repositories
 * @route GET /api/github/repos
 * @access Private (requires authentication)
 */
export const getUserRepos = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user with githubToken
    const user = await User.findById(userId).select('+githubToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has GitHub connected
    if (!user.githubUsername || !user.githubToken) {
      return res.status(400).json({
        success: false,
        message: 'GitHub account not connected. Please login with GitHub first.'
      });
    }

    // Fetch repositories
    const repos = await githubService.getUserRepos(user.githubUsername, user.githubToken);

    // Format response with essential repo info
    const formattedRepos = repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      isPrivate: repo.private,
      updatedAt: repo.updated_at,
      createdAt: repo.created_at
    }));

    res.status(200).json({
      success: true,
      message: 'Repositories fetched successfully',
      data: {
        count: formattedRepos.length,
        repositories: formattedRepos
      }
    });

  } catch (error) {
    console.error('❌ Get Repos Error:', error);
    
    if (error.message.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        message: 'GitHub API rate limit exceeded. Please try again later.'
      });
    }

    if (error.message.includes('token')) {
      return res.status(401).json({
        success: false,
        message: error.message,
        requiresReauth: true
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch repositories',
      error: error.message
    });
  }
};

/**
 * Get GitHub stats for the authenticated user (from cache)
 * @route GET /api/github/stats
 * @access Private (requires authentication)
 */
export const getGitHubStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has GitHub connected
    if (!user.githubUsername) {
      return res.status(400).json({
        success: false,
        message: 'GitHub account not connected'
      });
    }

    res.status(200).json({
      success: true,
      message: 'GitHub stats retrieved successfully',
      data: {
        githubUsername: user.githubUsername,
        githubStats: user.githubStats || {
          repos: 0,
          commits: 0,
          pullRequests: 0,
          issues: 0,
          stars: 0
        },
        lastSync: user.lastSync
      }
    });

  } catch (error) {
    console.error('❌ Get GitHub Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve GitHub stats',
      error: error.message
    });
  }
};
