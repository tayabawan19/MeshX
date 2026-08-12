import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import chatRoutes from './routes/chatRoutes';
import storyRoutes from './routes/storyRoutes';
import callRoutes from './routes/callRoutes';
import mediaRoutes from './routes/mediaRoutes';
import { setupSocketIO } from './sockets/chatSocket';

dotenv.config();


const app = express();
const server = http.createServer(app);

const corsOrigin = process.env.CORS_ORIGIN || '*';

const io = new SocketIOServer(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/everchat';

// Security Middlewares
app.use(helmet());

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

// General API Rate Limiting (100 requests per 15 minutes per IP)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', generalLimiter);

// Express body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// NoSQL Injection Sanitization
app.use(mongoSanitize());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/media', mediaRoutes);


// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'MeshX API', timestamp: new Date() });
});

// Setup Socket.io logic
setupSocketIO(io);

// MongoDB connection & server listen
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('[Database] Connected to MongoDB database successfully.');
    server.listen(PORT, () => {
      console.log(`[Server] MeshX real-time backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err: any) => {
    console.error('[Database] MongoDB connection error:', err);
    console.log('[Server] Starting server in offline MongoDB fallback mode...');
    server.listen(PORT, () => {
      console.log(`[Server] MeshX real-time backend running on http://localhost:${PORT} (without MongoDB)`);
    });
  });

