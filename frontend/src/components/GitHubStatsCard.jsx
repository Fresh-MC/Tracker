import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

/**
 * GitHubStatsCard - Display live GitHub statistics
 * Only visible for users logged in via GitHub OAuth
 * Shows: repos, commits, pull requests, issues, stars
 * Features: "Sync Now" button, last sync timestamp, loading states
 */

const GitHubStatsCard = () => {
  const { user, refreshGitHubStats } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  // Don't show card if user is not logged in via GitHub
  if (!user || user.authProvider !== 'github') {
    return null;
  }

  const stats = user.githubStats || {
    repos: 0,
    commits: 0,
    pullRequests: 0,
    issues: 0,
    stars: 0
  };

  // Calculate time since last sync
  const getTimeSinceSync = () => {
    if (!user.lastSync) return 'Never';
    
    const now = new Date();
    const lastSync = new Date(user.lastSync);
    const diffMs = now - lastSync;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    
    const result = await refreshGitHubStats();
    
    if (!result.success) {
      setError(result.message || 'Failed to sync GitHub stats');
    }
    
    setSyncing(false);
  };

  const statItems = [
    { label: 'Repos', value: stats.repos, icon: '📦', color: '#2e4f4f' },
    { label: 'Commits', value: stats.commits, icon: '💻', color: '#31493c' },
    { label: 'PRs', value: stats.pullRequests, icon: '🔀', color: '#2e4f4f' },
    { label: 'Issues', value: stats.issues, icon: '🐛', color: '#c05a43' },
    { label: 'Stars', value: stats.stars, icon: '⭐', color: '#31493c' }
  ];

  return (
    <motion.div
      className="rounded-2xl p-6 border backdrop-blur-sm"
      style={{
        backgroundColor: '#181818',
        borderColor: 'rgba(248, 247, 236, 0.1)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="text-3xl">
            <svg className="w-8 h-8" style={{ color: '#f8f7ec' }} fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold" style={{ color: '#f8f7ec' }}>GitHub Stats</h3>
            {user.githubUsername && (
              <p className="text-sm" style={{ color: 'rgba(248, 247, 236, 0.7)' }}>@{user.githubUsername}</p>
            )}
          </div>
        </div>
        
        {/* Sync Button */}
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          style={{
            backgroundColor: syncing ? 'rgba(248, 247, 236, 0.2)' : '#2e4f4f',
            color: '#f8f7ec',
            boxShadow: syncing ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            cursor: syncing ? 'not-allowed' : 'pointer'
          }}
          onMouseEnter={(e) => {
            if (!syncing) {
              e.currentTarget.style.backgroundColor = '#31493c';
            }
          }}
          onMouseLeave={(e) => {
            if (!syncing) {
              e.currentTarget.style.backgroundColor = '#2e4f4f';
            }
          }}
        >
          {syncing ? (
            <>
              <motion.div
                className="w-4 h-4 border-2 rounded-full"
                style={{ 
                  borderColor: '#f8f7ec',
                  borderTopColor: 'transparent'
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              Syncing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync Now
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          className="mb-4 p-3 rounded-lg text-sm"
          style={{
            backgroundColor: 'rgba(192, 90, 67, 0.15)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: '#c05a43',
            color: '#f8f7ec'
          }}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          {error}
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-4 mb-4">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            className="rounded-xl p-4 text-center border backdrop-blur-sm transition-all cursor-pointer"
            style={{
              backgroundColor: 'rgba(248, 247, 236, 0.03)',
              borderColor: 'rgba(248, 247, 236, 0.08)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{
              backgroundColor: 'rgba(248, 247, 236, 0.05)',
              borderColor: 'rgba(248, 247, 236, 0.15)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
          >
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="text-2xl font-bold mb-1" style={{ color: item.color }}>
              {syncing ? (
                <motion.div
                  className="w-6 h-6 mx-auto border-2 rounded-full"
                  style={{
                    borderColor: item.color,
                    borderTopColor: 'transparent'
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                item.value.toLocaleString()
              )}
            </div>
            <div className="text-xs uppercase tracking-wide" style={{ color: 'rgba(248, 247, 236, 0.6)' }}>{item.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Last Sync Info */}
      <div className="flex items-center justify-between text-sm pt-4 border-t" style={{ 
        color: 'rgba(248, 247, 236, 0.7)',
        borderColor: 'rgba(248, 247, 236, 0.1)'
      }}>
        <span>Last synced: {getTimeSinceSync()}</span>
        <span className="text-xs" style={{ color: 'rgba(248, 247, 236, 0.5)' }}>
          {user.lastSync && new Date(user.lastSync).toLocaleString()}
        </span>
      </div>
    </motion.div>
  );
};

export default GitHubStatsCard;
