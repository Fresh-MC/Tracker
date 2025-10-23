import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import session from 'express-session';

// Load environment variables
dotenv.config();

// Import config and middleware
import connectDB from './config/database.js';
import configurePassport from './config/passport.js';
import errorHandler from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import userRoutes from './routes/userRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import integrationRoutes from './routes/integrationRoutes.js';
import invitationRoutes from './routes/invitationRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import githubAuthRoutes from './routes/githubAuthRoutes.js';
import githubRoutes from './routes/githubRoutes.js';

// Initialize Express app
const app = express();

// ============================================
// CONNECT TO DATABASE
// ============================================
connectDB();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet - Security headers
app.use(helmet());

// CORS - Cross-Origin Resource Sharing
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5174',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// ============================================
// BODY PARSING MIDDLEWARE
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ============================================
// SESSION & PASSPORT MIDDLEWARE
// ============================================
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // true in production (HTTPS)
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport strategies
configurePassport();

// ============================================
// LOGGING MIDDLEWARE
// ============================================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ============================================
// API ROUTES
// ============================================

// Health check endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Tracker KPR API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', githubAuthRoutes);

// Resource routes
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/github', githubRoutes);

// Legacy endpoints for backward compatibility
app.use('/api/login', authRoutes);
app.use('/api/register', authRoutes);
app.use('/api/profile', authRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  console.log('═══════════════════════════════════════════');
  console.log('');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

export default app;
