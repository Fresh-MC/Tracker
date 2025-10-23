import mongoose from 'mongoose';

const reportCacheSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reportType: {
    type: String,
    enum: ['weekly', 'monthly', 'custom', 'quick'],
    default: 'weekly'
  },
  query: {
    type: String,
    default: ''
  },
  data: {
    healthScore: Number,
    totalModules: Number,
    completedModules: Number,
    delayedModules: Number,
    insights: String,
    blockers: [{
      moduleId: mongoose.Schema.Types.ObjectId,
      title: String,
      reason: String,
      priority: String,
      daysOverdue: Number
    }],
    recommendations: [String],
    teamPerformance: [{
      userId: mongoose.Schema.Types.ObjectId,
      name: String,
      completionRate: Number,
      totalAssigned: Number,
      completed: Number
    }]
  },
  pdfFilename: {
    type: String,
    default: null
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// TTL index to automatically delete expired cache entries
reportCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for efficient queries
reportCacheSchema.index({ userId: 1, reportType: 1, createdAt: -1 });

const ReportCache = mongoose.model('ReportCache', reportCacheSchema);

export default ReportCache;
