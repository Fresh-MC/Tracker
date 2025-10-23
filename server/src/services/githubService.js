import axios from 'axios';
import { decryptToken } from '../config/passport.js';

/**
 * GitHub Service Layer
 * Handles all GitHub REST API v3 calls
 * Documentation: https://docs.github.com/en/rest
 */

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Create axios instance with GitHub API headers
 * @param {string} token - Decrypted GitHub access token
 * @returns {axios.AxiosInstance}
 */
const createGitHubClient = (token) => {
  return axios.create({
    baseURL: GITHUB_API_BASE,
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `token ${token}`,
      'User-Agent': 'Tracker-KPR-App'
    },
    timeout: 10000 // 10 second timeout
  });
};

/**
 * Get user's public repositories
 * @param {string} username - GitHub username
 * @param {string} encryptedToken - Encrypted GitHub access token
 * @returns {Promise<Array>} List of repositories
 */
export const getUserRepos = async (username, encryptedToken) => {
  try {
    const token = decryptToken(encryptedToken);
    if (!token) throw new Error('Invalid or missing GitHub token');

    const client = createGitHubClient(token);
    const response = await client.get(`/users/${username}/repos`, {
      params: {
        type: 'all', // all repos (public + private if token has access)
        sort: 'updated',
        per_page: 100 // max repos to fetch
      }
    });

    return response.data;
  } catch (error) {
    console.error('❌ GitHub API Error (getUserRepos):', error.response?.data || error.message);
    if (error.response?.status === 401) {
      throw new Error('GitHub token is invalid or expired. Please reconnect your GitHub account.');
    }
    if (error.response?.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Please try again later.');
    }
    throw new Error('Failed to fetch GitHub repositories');
  }
};

/**
 * Get user's total commit count across all repos
 * @param {string} username - GitHub username
 * @param {string} encryptedToken - Encrypted GitHub access token
 * @returns {Promise<number>} Total commit count
 */
export const getUserCommits = async (username, encryptedToken) => {
  try {
    const token = decryptToken(encryptedToken);
    if (!token) throw new Error('Invalid or missing GitHub token');

    const client = createGitHubClient(token);
    
    // GitHub Search API for commits by author
    const response = await client.get('/search/commits', {
      params: {
        q: `author:${username}`,
        per_page: 1 // We only need the total count
      }
    });

    return response.data.total_count || 0;
  } catch (error) {
    console.error('❌ GitHub API Error (getUserCommits):', error.response?.data || error.message);
    if (error.response?.status === 401) {
      throw new Error('GitHub token is invalid or expired');
    }
    if (error.response?.status === 403) {
      throw new Error('GitHub API rate limit exceeded');
    }
    // Return 0 if search fails (commits require special access)
    return 0;
  }
};

/**
 * Get user's pull requests count
 * @param {string} username - GitHub username
 * @param {string} encryptedToken - Encrypted GitHub access token
 * @returns {Promise<number>} Total PR count
 */
export const getUserPullRequests = async (username, encryptedToken) => {
  try {
    const token = decryptToken(encryptedToken);
    if (!token) throw new Error('Invalid or missing GitHub token');

    const client = createGitHubClient(token);
    
    // GitHub Search API for PRs by author
    const response = await client.get('/search/issues', {
      params: {
        q: `author:${username} type:pr`,
        per_page: 1
      }
    });

    return response.data.total_count || 0;
  } catch (error) {
    console.error('❌ GitHub API Error (getUserPullRequests):', error.response?.data || error.message);
    if (error.response?.status === 401) {
      throw new Error('GitHub token is invalid or expired');
    }
    if (error.response?.status === 403) {
      throw new Error('GitHub API rate limit exceeded');
    }
    return 0;
  }
};

/**
 * Get user's issues count
 * @param {string} username - GitHub username
 * @param {string} encryptedToken - Encrypted GitHub access token
 * @returns {Promise<number>} Total issues count
 */
export const getUserIssues = async (username, encryptedToken) => {
  try {
    const token = decryptToken(encryptedToken);
    if (!token) throw new Error('Invalid or missing GitHub token');

    const client = createGitHubClient(token);
    
    // GitHub Search API for issues by author
    const response = await client.get('/search/issues', {
      params: {
        q: `author:${username} type:issue`,
        per_page: 1
      }
    });

    return response.data.total_count || 0;
  } catch (error) {
    console.error('❌ GitHub API Error (getUserIssues):', error.response?.data || error.message);
    if (error.response?.status === 401) {
      throw new Error('GitHub token is invalid or expired');
    }
    if (error.response?.status === 403) {
      throw new Error('GitHub API rate limit exceeded');
    }
    return 0;
  }
};

/**
 * Calculate total stars across all user's repositories
 * @param {string} username - GitHub username
 * @param {string} encryptedToken - Encrypted GitHub access token
 * @returns {Promise<number>} Total stars count
 */
export const getUserStars = async (username, encryptedToken) => {
  try {
    const repos = await getUserRepos(username, encryptedToken);
    const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
    return totalStars;
  } catch (error) {
    console.error('❌ GitHub API Error (getUserStars):', error.message);
    return 0;
  }
};

/**
 * Sync all GitHub stats for a user
 * @param {Object} user - User document from MongoDB (must have githubUsername and githubToken)
 * @returns {Promise<Object>} Updated stats object
 */
export const syncAllStats = async (user) => {
  if (!user.githubUsername || !user.githubToken) {
    throw new Error('User does not have GitHub credentials');
  }

  console.log(`🔄 Syncing GitHub stats for: ${user.githubUsername}`);

  try {
    // Fetch all stats in parallel for better performance
    const [repos, commits, pullRequests, issues, stars] = await Promise.all([
      getUserRepos(user.githubUsername, user.githubToken).then(repos => repos.length),
      getUserCommits(user.githubUsername, user.githubToken),
      getUserPullRequests(user.githubUsername, user.githubToken),
      getUserIssues(user.githubUsername, user.githubToken),
      getUserStars(user.githubUsername, user.githubToken)
    ]);

    const stats = {
      repos: repos || 0,
      commits: commits || 0,
      pullRequests: pullRequests || 0,
      issues: issues || 0,
      stars: stars || 0
    };

    console.log(`✅ Synced GitHub stats:`, stats);

    return stats;
  } catch (error) {
    console.error('❌ Failed to sync GitHub stats:', error.message);
    throw error;
  }
};

/**
 * Verify GitHub token is still valid
 * @param {string} encryptedToken - Encrypted GitHub access token
 * @returns {Promise<boolean>} True if token is valid
 */
export const verifyGitHubToken = async (encryptedToken) => {
  try {
    const token = decryptToken(encryptedToken);
    if (!token) return false;

    const client = createGitHubClient(token);
    await client.get('/user'); // Simple endpoint to verify token
    return true;
  } catch (error) {
    console.error('❌ GitHub token verification failed:', error.response?.status);
    return false;
  }
};
