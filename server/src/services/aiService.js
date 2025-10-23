import { GoogleGenerativeAI } from '@google/generative-ai';
import User from '../models/User.js';
import Project from '../models/Project.js';

// Initialize Gemini API (ensure GEMINI_API_KEY is in .env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Calculate overall project health score (0-100)
 * Based on completion rate, delay ratio, and active tasks
 */
const calculateHealthScore = (projectData) => {
  const { totalModules, completedModules, delayedModules, onTimeModules } = projectData;
  
  if (totalModules === 0) return 100;
  
  const completionRate = (completedModules / totalModules) * 100;
  const delayRate = delayedModules / Math.max(totalModules, 1);
  const onTimeRate = onTimeModules / Math.max(completedModules, 1);
  
  // Health formula: 40% completion + 30% on-time rate + 30% inverse delay rate
  const healthScore = Math.round(
    (completionRate * 0.4) +
    (onTimeRate * 30) +
    ((1 - delayRate) * 30)
  );
  
  return Math.min(100, Math.max(0, healthScore));
};

/**
 * Identify top blockers in project
 */
const identifyBlockers = (modules) => {
  const blockers = [];
  
  modules.forEach(module => {
    // Check for delayed tasks
    if (module.status !== 'Completed' && module.dueDate) {
      const dueDate = new Date(module.dueDate);
      const today = new Date();
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      
      if (daysOverdue > 0) {
        blockers.push({
          moduleId: module._id,
          title: module.title,
          daysOverdue,
          reason: `Overdue by ${daysOverdue} days`,
          priority: module.priority || 'medium',
          assignedTo: module.assignedToUserId
        });
      }
    }
    
    // Check for blocked dependencies
    if (module.dependencies && module.dependencies.length > 0) {
      const unblockedDeps = module.dependencies.filter(dep => 
        modules.find(m => m._id.toString() === dep.toString() && m.status !== 'Completed')
      );
      
      if (unblockedDeps.length > 0) {
        blockers.push({
          moduleId: module._id,
          title: module.title,
          reason: `Waiting on ${unblockedDeps.length} dependencies`,
          priority: 'high',
          assignedTo: module.assignedToUserId
        });
      }
    }
  });
  
  // Sort by priority and days overdue
  return blockers
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0) || 
             (b.daysOverdue || 0) - (a.daysOverdue || 0);
    })
    .slice(0, 5); // Top 5 blockers
};

/**
 * Analyze team performance
 */
const analyzeTeamPerformance = (modules, users) => {
  const userStats = {};
  
  users.forEach(user => {
    userStats[user._id.toString()] = {
      userId: user._id,
      name: user.name,
      email: user.email,
      totalAssigned: 0,
      completed: 0,
      delayed: 0,
      onTime: 0,
      completionRate: 0
    };
  });
  
  modules.forEach(module => {
    const userId = module.assignedToUserId?.toString();
    if (!userId || !userStats[userId]) return;
    
    userStats[userId].totalAssigned++;
    
    if (module.status === 'Completed') {
      userStats[userId].completed++;
      
      // Check if completed on time
      if (module.completedDate && module.dueDate) {
        const completed = new Date(module.completedDate);
        const due = new Date(module.dueDate);
        
        if (completed <= due) {
          userStats[userId].onTime++;
        } else {
          userStats[userId].delayed++;
        }
      }
    }
  });
  
  // Calculate completion rates
  Object.values(userStats).forEach(stats => {
    if (stats.totalAssigned > 0) {
      stats.completionRate = Math.round((stats.completed / stats.totalAssigned) * 100);
    }
  });
  
  return Object.values(userStats)
    .filter(stat => stat.totalAssigned > 0)
    .sort((a, b) => b.completionRate - a.completionRate);
};

/**
 * Generate AI-powered insights using Gemini
 */
const generateAIInsights = async (query, projectData, userId) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Prepare context for AI
    const context = `
You are an intelligent project management assistant for the SH19 Digital Project Management Tracker.

PROJECT DATA:
- Total Modules: ${projectData.totalModules}
- Completed: ${projectData.completedModules}
- In Progress: ${projectData.inProgressModules}
- Delayed: ${projectData.delayedModules}
- On Time: ${projectData.onTimeModules}
- Health Score: ${projectData.healthScore}/100

TOP BLOCKERS:
${projectData.blockers.map((b, i) => `${i + 1}. ${b.title} - ${b.reason}`).join('\n')}

TEAM PERFORMANCE:
${projectData.teamPerformance.slice(0, 5).map(tp => 
  `- ${tp.name}: ${tp.completed}/${tp.totalAssigned} tasks (${tp.completionRate}% completion)`
).join('\n')}

USER QUERY: "${query}"

Respond with actionable insights in a conversational but professional tone. 
Focus on: specific recommendations, identifying patterns, and suggesting next actions.
Keep response concise (2-4 paragraphs max).
`;
    
    const result = await model.generateContent(context);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error('❌ Gemini API Error:', error.message);
    
    // Fallback to rule-based response if API fails
    return generateFallbackResponse(query, projectData);
  }
};

/**
 * Fallback response when AI API is unavailable
 */
const generateFallbackResponse = (query, projectData) => {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('summar') || lowerQuery.includes('week')) {
    return `📊 **Weekly Summary**\n\nYour project health is at ${projectData.healthScore}/100. You've completed ${projectData.completedModules} out of ${projectData.totalModules} modules (${Math.round((projectData.completedModules/projectData.totalModules)*100)}%). ${projectData.delayedModules > 0 ? `⚠️ ${projectData.delayedModules} tasks are delayed.` : '✅ All tasks are on track!'}\n\n**Recommended Actions:**\n1. Focus on the top ${projectData.blockers.length} blockers listed\n2. Review delayed tasks with team members\n3. Adjust timelines for overdue modules`;
  }
  
  if (lowerQuery.includes('blocker') || lowerQuery.includes('issue') || lowerQuery.includes('problem')) {
    if (projectData.blockers.length === 0) {
      return '✅ Great news! No critical blockers detected. All tasks are progressing smoothly.';
    }
    return `🚨 **Top Blockers Detected:**\n\n${projectData.blockers.slice(0, 3).map((b, i) => 
      `${i + 1}. **${b.title}**\n   - ${b.reason}\n   - Priority: ${b.priority.toUpperCase()}`
    ).join('\n\n')}\n\n**Recommendation:** Address these blockers immediately to maintain project momentum.`;
  }
  
  if (lowerQuery.includes('behind') || lowerQuery.includes('delayed') || lowerQuery.includes('late')) {
    const delayedModules = projectData.blockers.filter(b => b.daysOverdue > 0);
    if (delayedModules.length === 0) {
      return '✅ No modules are behind schedule. Keep up the great work!';
    }
    return `⏰ **Delayed Modules:**\n\n${delayedModules.slice(0, 3).map((m, i) => 
      `${i + 1}. ${m.title} - ${m.daysOverdue} days overdue`
    ).join('\n')}\n\nConsider reassigning resources or adjusting deadlines.`;
  }
  
  if (lowerQuery.includes('team') || lowerQuery.includes('performance')) {
    return `👥 **Team Performance Summary:**\n\n${projectData.teamPerformance.slice(0, 3).map((tp, i) => 
      `${i + 1}. ${tp.name}: ${tp.completionRate}% completion rate (${tp.completed}/${tp.totalAssigned} tasks)`
    ).join('\n')}\n\nTop performer: ${projectData.teamPerformance[0]?.name || 'N/A'}`;
  }
  
  // Default response
  return `Based on your project data:\n\n📊 Health Score: ${projectData.healthScore}/100\n✅ Completed: ${projectData.completedModules}/${projectData.totalModules}\n⚠️ Delayed: ${projectData.delayedModules}\n\nAsk me about: "summarize my week", "find blockers", "team performance", or "which tasks are delayed"`;
};

/**
 * Main function to handle AI assistant queries
 */
const handleAssistantQuery = async (query, userId) => {
  try {
    // Fetch user data
    const user = await User.findById(userId).populate('teamId');
    if (!user) {
      throw new Error('User not found');
    }
    
    // Fetch user's projects with modules
    const projects = await Project.find({
      $or: [
        { teamId: user.teamId?._id },
        { 'modules.assignedToUserId': userId }
      ]
    }).populate('modules.assignedToUserId');
    
    // Aggregate all modules from user's projects
    let allModules = [];
    projects.forEach(project => {
      if (project.modules) {
        allModules = allModules.concat(
          project.modules.map(m => ({
            ...m.toObject(),
            projectId: project._id,
            projectTitle: project.title
          }))
        );
      }
    });
    
    // Calculate project statistics
    const totalModules = allModules.length;
    const completedModules = allModules.filter(m => m.status === 'Completed').length;
    const inProgressModules = allModules.filter(m => m.status === 'In Progress').length;
    const delayedModules = allModules.filter(m => {
      if (m.status === 'Completed' || !m.dueDate) return false;
      return new Date(m.dueDate) < new Date();
    }).length;
    const onTimeModules = allModules.filter(m => {
      if (m.status !== 'Completed' || !m.completedDate || !m.dueDate) return false;
      return new Date(m.completedDate) <= new Date(m.dueDate);
    }).length;
    
    // Get team members
    const teamMembers = await User.find({ teamId: user.teamId?._id });
    
    // Build comprehensive project data
    const projectData = {
      totalModules,
      completedModules,
      inProgressModules,
      delayedModules,
      onTimeModules,
      healthScore: calculateHealthScore({ totalModules, completedModules, delayedModules, onTimeModules }),
      blockers: identifyBlockers(allModules),
      teamPerformance: analyzeTeamPerformance(allModules, teamMembers)
    };
    
    // Generate AI insights
    const aiResponse = await generateAIInsights(query, projectData, userId);
    
    // Prepare structured response
    return {
      success: true,
      query,
      timestamp: new Date().toISOString(),
      projectData: {
        healthScore: projectData.healthScore,
        totalModules: projectData.totalModules,
        completedModules: projectData.completedModules,
        delayedModules: projectData.delayedModules
      },
      insights: aiResponse,
      blockers: projectData.blockers.slice(0, 3),
      recommendations: generateRecommendations(projectData),
      teamPerformance: projectData.teamPerformance.slice(0, 5)
    };
    
  } catch (error) {
    console.error('❌ AI Assistant Error:', error);
    throw error;
  }
};

/**
 * Generate actionable recommendations
 */
const generateRecommendations = (projectData) => {
  const recommendations = [];
  
  // Health-based recommendations
  if (projectData.healthScore < 50) {
    recommendations.push('🚨 Critical: Health score is low. Schedule an urgent team review meeting.');
  } else if (projectData.healthScore < 70) {
    recommendations.push('⚠️ Warning: Project health declining. Review task priorities and resource allocation.');
  }
  
  // Delay-based recommendations
  if (projectData.delayedModules > projectData.completedModules * 0.3) {
    recommendations.push('⏰ High delay rate detected. Consider extending deadlines or adding resources.');
  }
  
  // Blocker-based recommendations
  if (projectData.blockers.length > 0) {
    recommendations.push(`🚧 Address ${projectData.blockers.length} critical blockers to unblock downstream tasks.`);
  }
  
  // Team performance recommendations
  const lowPerformers = projectData.teamPerformance.filter(tp => tp.completionRate < 50);
  if (lowPerformers.length > 0) {
    recommendations.push(`👥 ${lowPerformers.length} team member(s) need support. Consider workload redistribution.`);
  }
  
  // Default positive recommendation
  if (recommendations.length === 0) {
    recommendations.push('✅ Project is on track! Maintain current pace and monitor for emerging risks.');
  }
  
  return recommendations;
};

export {
  handleAssistantQuery,
  calculateHealthScore,
  identifyBlockers,
  analyzeTeamPerformance,
  generateRecommendations
};
