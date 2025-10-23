import { handleAssistantQuery } from '../services/aiService.js';
import { generateProjectReport, generateQuickSummary } from '../services/reportService.js';
import ReportCache from '../models/ReportCache.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Handle AI assistant chat queries
 * POST /api/ai/assistant
 */
const chatWithAssistant = async (req, res) => {
  try {
    const { query } = req.body;
    const userId = req.user.id;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }
    
    console.log(`🤖 AI Query from ${userId}: "${query}"`);
    
    // Check cache for similar recent queries (within last hour)
    const cacheKey = query.toLowerCase().trim();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const cachedResult = await ReportCache.findOne({
      userId,
      query: cacheKey,
      reportType: 'quick',
      createdAt: { $gte: oneHourAgo }
    }).sort({ createdAt: -1 });
    
    if (cachedResult) {
      console.log('📦 Returning cached AI response');
      return res.json({
        success: true,
        cached: true,
        ...cachedResult.data,
        timestamp: cachedResult.createdAt
      });
    }
    
    // Generate new insights
    const result = await handleAssistantQuery(query, userId);
    
    // Cache the result (expires in 1 hour)
    await ReportCache.create({
      userId,
      reportType: 'quick',
      query: cacheKey,
      data: {
        healthScore: result.projectData.healthScore,
        totalModules: result.projectData.totalModules,
        completedModules: result.projectData.completedModules,
        delayedModules: result.projectData.delayedModules,
        insights: result.insights,
        blockers: result.blockers,
        recommendations: result.recommendations,
        teamPerformance: result.teamPerformance
      },
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });
    
    // Emit Socket.IO event for real-time dashboard updates
    if (req.app.get('io')) {
      req.app.get('io').to(`user:${userId}`).emit('ai_response', {
        query,
        healthScore: result.projectData.healthScore,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      cached: false,
      ...result
    });
    
  } catch (error) {
    console.error('❌ AI Assistant Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process AI query',
      message: error.message
    });
  }
};

/**
 * Generate and download PDF report
 * POST /api/reports/generate
 */
const generateReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.body;
    
    console.log(`📄 Generating PDF report for user ${userId}`);
    
    // Check for recent report (within last 6 hours)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const recentReport = await ReportCache.findOne({
      userId,
      reportType: 'weekly',
      createdAt: { $gte: sixHoursAgo },
      pdfFilename: { $ne: null }
    }).sort({ createdAt: -1 });
    
    if (recentReport && recentReport.pdfFilename) {
      console.log('📦 Returning cached PDF report');
      return res.json({
        success: true,
        cached: true,
        filename: recentReport.pdfFilename,
        downloadUrl: `/api/reports/download/${recentReport.pdfFilename}`,
        healthScore: recentReport.data.healthScore,
        timestamp: recentReport.createdAt
      });
    }
    
    // Generate new report
    const reportResult = await generateProjectReport(userId, projectId);
    
    // Cache the report metadata
    await ReportCache.create({
      userId,
      reportType: 'weekly',
      query: 'weekly report',
      pdfFilename: reportResult.filename,
      data: {
        healthScore: reportResult.healthScore
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    // Emit Socket.IO event
    if (req.app.get('io')) {
      req.app.get('io').to(`user:${userId}`).emit('report_generated', {
        filename: reportResult.filename,
        healthScore: reportResult.healthScore,
        timestamp: reportResult.timestamp
      });
    }
    
    res.json({
      success: true,
      cached: false,
      filename: reportResult.filename,
      downloadUrl: `/api/reports/download/${reportResult.filename}`,
      healthScore: reportResult.healthScore,
      timestamp: reportResult.timestamp
    });
    
  } catch (error) {
    console.error('❌ Report Generation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report',
      message: error.message
    });
  }
};

/**
 * Download PDF report
 * GET /api/reports/download/:filename
 */
const downloadReport = async (req, res) => {
  try {
    const { filename } = req.params;
    const userId = req.user.id;
    
    // Verify the report belongs to the user
    const reportCache = await ReportCache.findOne({
      userId,
      pdfFilename: filename
    });
    
    if (!reportCache) {
      return res.status(404).json({
        success: false,
        error: 'Report not found or access denied'
      });
    }
    
    const filepath = path.join(__dirname, '../../reports', filename);
    
    // Check if file exists
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        error: 'Report file not found'
      });
    }
    
    // Send file
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('❌ Download Error:', err);
        res.status(500).json({
          success: false,
          error: 'Failed to download report'
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Download Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download report',
      message: error.message
    });
  }
};

/**
 * Get quick project summary (without PDF)
 * GET /api/ai/summary
 */
const getQuickSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`📊 Generating quick summary for user ${userId}`);
    
    const summary = await generateQuickSummary(userId);
    
    res.json(summary);
    
  } catch (error) {
    console.error('❌ Quick Summary Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate summary',
      message: error.message
    });
  }
};

/**
 * Get user's report history
 * GET /api/reports/history
 */
const getReportHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;
    
    const reports = await ReportCache.find({
      userId,
      pdfFilename: { $ne: null }
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .select('reportType pdfFilename createdAt data.healthScore');
    
    res.json({
      success: true,
      reports: reports.map(r => ({
        filename: r.pdfFilename,
        type: r.reportType,
        healthScore: r.data?.healthScore,
        createdAt: r.createdAt,
        downloadUrl: `/api/reports/download/${r.pdfFilename}`
      }))
    });
    
  } catch (error) {
    console.error('❌ Report History Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report history',
      message: error.message
    });
  }
};

/**
 * Clear expired cache entries manually
 * DELETE /api/reports/cache/clear
 */
const clearExpiredCache = async (req, res) => {
  try {
    const result = await ReportCache.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Cleared ${result.deletedCount} expired cache entries`
    });
    
  } catch (error) {
    console.error('❌ Cache Clear Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error.message
    });
  }
};

export {
  chatWithAssistant,
  generateReport,
  downloadReport,
  getQuickSummary,
  getReportHistory,
  clearExpiredCache
};
