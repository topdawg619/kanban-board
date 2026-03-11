require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const db = require('./database');
const boardsRouter = require('./routes/boards');
const columnsRouter = require('./routes/columns');
const cardsRouter = require('./routes/cards');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

// Attach io to app so routes can emit events
app.set('io', io);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/boards', boardsRouter);
app.use('/api/columns', columnsRouter);
app.use('/api/cards', cardsRouter);

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('join:board', (boardId) => {
    socket.join(`board:${boardId}`);
    console.log(`📋 ${socket.id} joined board:${boardId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});
