require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const boardsRouter  = require('./routes/boards');
const columnsRouter = require('./routes/columns');
const cardsRouter   = require('./routes/cards');

const PORT = process.env.PORT || 3001;

// ─── App & HTTP server ────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 Client connected    [${socket.id}]`);

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected [${socket.id}]`);
  });

  // Allow clients to join a board room for scoped events
  socket.on('join:board', (boardId) => {
    socket.join(`board:${boardId}`);
    console.log(`   → Socket ${socket.id} joined board:${boardId}`);
  });

  socket.on('leave:board', (boardId) => {
    socket.leave(`board:${boardId}`);
  });
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger (dev)
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/boards',  boardsRouter);
app.use('/api/columns', columnsRouter);
app.use('/api/cards',   cardsRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  });
});

// API root — list all endpoints
app.get('/api', (_req, res) => {
  res.json({
    name: 'Kanban Board API',
    version: '1.0.0',
    endpoints: {
      boards: {
        'GET  /api/boards':                'List all boards',
        'POST /api/boards':                'Create a board',
        'GET  /api/boards/:id':            'Get a board',
        'GET  /api/boards/:id/columns':    'Get columns + cards for a board',
      },
      columns: {
        'POST   /api/columns':    'Create a column',
        'PUT    /api/columns/:id':'Update a column',
        'DELETE /api/columns/:id':'Delete a column',
      },
      cards: {
        'GET    /api/cards':      'List cards (optional ?column_id=)',
        'GET    /api/cards/:id':  'Get a card',
        'POST   /api/cards':      'Create a card',
        'PUT    /api/cards/:id':  'Update / move a card',
        'DELETE /api/cards/:id':  'Delete a card',
      },
    },
    socket_events: {
      emitted: [
        'board:created',
        'column:created', 'column:updated', 'column:deleted',
        'card:created', 'card:updated', 'card:moved', 'card:deleted',
      ],
      client_emit: ['join:board', 'leave:board'],
    },
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║       🚀  Kanban Board API  is running       ║');
  console.log(`║       http://localhost:${PORT}                  ║`);
  console.log('║       Socket.io   ready for connections      ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
});

module.exports = { app, server, io };
