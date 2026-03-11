const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const router = express.Router();

/**
 * GET /api/boards
 * Returns all boards
 */
router.get('/', (req, res) => {
  try {
    const boards = db.prepare(`
      SELECT b.*,
        (SELECT COUNT(*) FROM columns c WHERE c.board_id = b.id) AS column_count,
        (SELECT COUNT(*) FROM cards k
          JOIN columns c ON k.column_id = c.id
          WHERE c.board_id = b.id) AS card_count
      FROM boards b
      ORDER BY b.created_at DESC
    `).all();
    res.json({ success: true, data: boards });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/boards/:id
 * Returns a single board
 */
router.get('/:id', (req, res) => {
  try {
    const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.params.id);
    if (!board) return res.status(404).json({ success: false, error: 'Board not found' });
    res.json({ success: true, data: board });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/boards
 * Create a new board
 */
router.post('/', (req, res) => {
  try {
    const { name, description = '' } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'Board name is required' });

    const id = uuidv4();
    db.prepare('INSERT INTO boards (id, name, description) VALUES (?, ?, ?)').run(id, name.trim(), description);
    const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(id);

    // Emit socket event
    const io = req.app.get('io');
    io.emit('board:created', board);

    res.status(201).json({ success: true, data: board });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/boards/:id/columns
 * Returns all columns with their cards for a given board
 */
router.get('/:id/columns', (req, res) => {
  try {
    const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.params.id);
    if (!board) return res.status(404).json({ success: false, error: 'Board not found' });

    const columns = db.prepare(`
      SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC
    `).all(req.params.id);

    const result = columns.map(col => {
      const cards = db.prepare(`
        SELECT * FROM cards WHERE column_id = ? ORDER BY position ASC
      `).all(col.id).map(card => ({
        ...card,
        labels: JSON.parse(card.labels || '[]'),
      }));
      return { ...col, cards };
    });

    res.json({ success: true, data: result, board });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
