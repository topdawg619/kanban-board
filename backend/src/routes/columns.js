const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const router = express.Router();

/**
 * POST /api/columns
 * Create a new column on a board
 */
router.post('/', (req, res) => {
  try {
    const { board_id, name, color = '#6366f1' } = req.body;
    if (!board_id) return res.status(400).json({ success: false, error: 'board_id is required' });
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'Column name is required' });

    const maxPos = db.prepare('SELECT MAX(position) as mp FROM columns WHERE board_id = ?').get(board_id);
    const position = (maxPos?.mp ?? -1) + 1;

    const id = uuidv4();
    db.prepare('INSERT INTO columns (id, board_id, name, color, position) VALUES (?, ?, ?, ?, ?)').run(
      id, board_id, name.trim(), color, position
    );
    const column = db.prepare('SELECT * FROM columns WHERE id = ?').get(id);

    req.app.get('io').to(`board:${board_id}`).emit('column:created', column);
    res.status(201).json({ success: true, data: column });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/columns/:id
 * Update a column (name, color)
 */
router.put('/:id', (req, res) => {
  try {
    const { name, color } = req.body;
    const col = db.prepare('SELECT * FROM columns WHERE id = ?').get(req.params.id);
    if (!col) return res.status(404).json({ success: false, error: 'Column not found' });

    db.prepare('UPDATE columns SET name = ?, color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      name ?? col.name, color ?? col.color, req.params.id
    );
    const updated = db.prepare('SELECT * FROM columns WHERE id = ?').get(req.params.id);
    req.app.get('io').to(`board:${updated.board_id}`).emit('column:updated', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/columns/:id
 * Delete a column and its cards
 */
router.delete('/:id', (req, res) => {
  try {
    const col = db.prepare('SELECT * FROM columns WHERE id = ?').get(req.params.id);
    if (!col) return res.status(404).json({ success: false, error: 'Column not found' });

    db.prepare('DELETE FROM columns WHERE id = ?').run(req.params.id);
    req.app.get('io').to(`board:${col.board_id}`).emit('column:deleted', { id: req.params.id, board_id: col.board_id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/columns/reorder
 * Reorder columns — body: { board_id, columnIds: [id, id, ...] }
 */
router.patch('/reorder', (req, res) => {
  try {
    const { board_id, columnIds } = req.body;
    if (!board_id || !Array.isArray(columnIds)) {
      return res.status(400).json({ success: false, error: 'board_id and columnIds[] required' });
    }
    const update = db.prepare('UPDATE columns SET position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND board_id = ?');
    const updateAll = db.transaction((ids) => {
      ids.forEach((id, i) => update.run(i, id, board_id));
    });
    updateAll(columnIds);
    req.app.get('io').to(`board:${board_id}`).emit('columns:reordered', { board_id, columnIds });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
