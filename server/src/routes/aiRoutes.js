import express from 'express';
import {
  chatWithAssistant,
  generateReport,
  downloadReport,
  getQuickSummary,
  getReportHistory,
  clearExpiredCache
} from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/ai/assistant
 * @desc    Chat with AI assistant
 * @access  Private
 * @body    { query: string }
 * @example POST /api/ai/assistant
 *          Body: { "query": "Summarize my week" }
 */
router.post('/assistant', chatWithAssistant);

/**
 * @route   GET /api/ai/summary
 * @desc    Get quick project summary
 * @access  Private
 */
router.get('/summary', getQuickSummary);

/**
 * @route   POST /api/reports/generate
 * @desc    Generate PDF report
 * @access  Private
 * @body    { projectId?: string }
 */
router.post('/reports/generate', generateReport);

/**
 * @route   GET /api/reports/download/:filename
 * @desc    Download PDF report
 * @access  Private
 */
router.get('/reports/download/:filename', downloadReport);

/**
 * @route   GET /api/reports/history
 * @desc    Get user's report history
 * @access  Private
 * @query   { limit?: number }
 */
router.get('/reports/history', getReportHistory);

/**
 * @route   DELETE /api/reports/cache/clear
 * @desc    Clear expired cache entries
 * @access  Private
 */
router.delete('/reports/cache/clear', clearExpiredCache);

export default router;
