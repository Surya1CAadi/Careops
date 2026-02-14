import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import onboardingRoutes from './routes/onboarding.routes';
import workspaceRoutes from './routes/workspace.routes';
import contactRoutes from './routes/contact.routes';
import bookingRoutes from './routes/booking.routes';
import formRoutes from './routes/form.routes';
import inventoryRoutes from './routes/inventory.routes';
import conversationRoutes from './routes/conversation.routes';
import inboxRoutes from './routes/inbox.routes';
import dashboardRoutes from './routes/dashboard.routes';
import automationRoutes from './routes/automation.routes';
import integrationRoutes from './routes/integration.routes';
import settingsRoutes from './routes/settings.routes';
import publicRoutes from './routes/public.routes';

// Import middleware
import { errorHandler } from './middleware/error.middleware';
import { notFound } from './middleware/notFound.middleware';

// Import services
import { startAutomationEngine } from './services/automation.service';

const app: Express = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make Socket.IO available in routes
app.set('io', io);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/integrations', integrationRoutes);app.use('/api/settings', settingsRoutes);
// Public Routes (no authentication required)
app.use('/api/public', publicRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-workspace', (workspaceId: string) => {
    socket.join(`workspace-${workspaceId}`);
    console.log(`Socket ${socket.id} joined workspace ${workspaceId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Start automation engine
  startAutomationEngine(io);
  console.log('⚙️  Automation engine started');
});

export { io };
export default app;
