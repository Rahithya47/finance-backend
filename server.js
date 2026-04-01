const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (for development)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.originalUrl}`);
        next();
    });
}

// Health check route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🚀 Finance Dashboard API is running!',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            records: '/api/records',
            dashboard: '/api/dashboard'
        },
        documentation: '/api/docs'
    });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/records', require('./routes/recordRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// API Documentation route
app.get('/api/docs', (req, res) => {
    res.json({
        success: true,
        message: 'Finance Dashboard API Documentation',
        endpoints: {
            authentication: {
                'POST /api/auth/register': 'Register new user',
                'POST /api/auth/login': 'Login user',
                'GET /api/auth/me': 'Get current user (Protected)',
                'GET /api/auth/users': 'Get all users (Admin)',
                'PUT /api/auth/users/:id/role': 'Update user role (Admin)'
            },
            records: {
                'GET /api/records': 'Get all records with pagination (Protected)',
                'GET /api/records/:id': 'Get single record (Protected)',
                'POST /api/records': 'Create record (Admin)',
                'POST /api/records/bulk': 'Bulk create records (Admin)',
                'PUT /api/records/:id': 'Update record (Admin)',
                'DELETE /api/records/:id': 'Delete record (Admin)'
            },
            dashboard: {
                'GET /api/dashboard/summary': 'Get financial summary (Protected)',
                'GET /api/dashboard/categories': 'Get category breakdown (Protected)',
                'GET /api/dashboard/trends': 'Get monthly trends (Analyst/Admin)',
                'GET /api/dashboard/top-expenses': 'Get top expenses (Protected)',
                'GET /api/dashboard/comparison': 'Get period comparison (Analyst/Admin)'
            }
        },
        roles: {
            viewer: 'Can only read data',
            analyst: 'Can read and analyze data',
            admin: 'Full access to all operations'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════════╗
    ║                                                   ║
    ║   🚀 Finance Dashboard Backend Server            ║
    ║                                                   ║
    ║   📍 Running on: http://localhost:${PORT}          ║
    ║   📝 Environment: ${process.env.NODE_ENV || 'development'}               ║
    ║   📚 API Docs: http://localhost:${PORT}/api/docs   ║
    ║                                                   ║
    ╚═══════════════════════════════════════════════════╝
    `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
});