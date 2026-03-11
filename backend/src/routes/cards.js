const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const router = express.Router();

/**
 * POST /api/cards
 * Create a new card in a column
 */
router.post('/', (req, res) => {
  try {
    const { column_id, title, description = '', priority = 'medium', due_date = null, labels = [], assignee = null } = req.body;
    if (!column_id) return res.status(400).json({ success: false, error: 'column_id is required' });
    if (!title?.trim()) return res.status(400).json({ success: false, error: 'Card title is required' });

    const maxPos = db.prepare('SELECT MAX(position) as mp FROM cards WHERE column_id = ?').get(column_id);
    const position = (maxPos?.mp ?? -1) + 1;

    const id = uuidv4();
    db.prepare(
      'INSERT INTO cards (id, column_id, title, description, priority, position, due_date, labels, assignee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, column_id, title.trim(), description, priority, position, due_date, JSON.stringify(labels), assignee);

    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
    const parsed = { ...card, labels: JSON.parse(card.labels || '[]') };

    // Get board_id for socket room
    const col = db.prepare('SELECT board_id FROM columns WHERE id = ?').get(column_id);
    if (col) req.app.get('io').to(`board:${col.board_id}`).emit('card:created', parsed);

    res.status(201).json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/cards/:id
 * Get a single card
 */
router.get('/:id', (req, res) => {
  try {
    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    if (!card) return res.status(404).json({ success: false, error: 'Card not found' });
    res.json({ success: true, data: { ...card, labels: JSON.parse(card.labels || '[]') } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/cards/:id
 * Update a card's fields
 */
router.put('/:id', (req, res) => {
  try {
    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    if (!card) return res.status(404).json({ success: false, error: 'Card not found' });

    const { title, description, priority, due_date, labels, assignee } = req.body;
    db.prepare(`
      UPDATE cards SET
        title = ?, description = ?, priority = ?, due_date = ?,
        labels = ?, assignee = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title ?? card.title,
      description ?? card.description,
      priority ?? card.priority,
      due_date !== undefined ? due_date : card.due_date,
      labels !== undefined ? JSON.stringify(labels) : card.labels,
      assignee !== undefined ? assignee : card.assignee,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    const parsed = { ...updated, labels: JSON.parse(updated.labels || '[]') };
    const col = db.prepare('SELECT board_id FROM columns WHERE id = ?').get(updated.column_id);
    if (col) req.app.get('io').to(`board:${col.board_id}`).emit('card:updated', parsed);
    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/cards/:id
 * Delete a card
 */
router.delete('/:id', (req, res) => {
  try {
    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    if (!card) return res.status(404).json({ success: false, error: 'Card not found' });

    const col = db.prepare('SELECT board_id FROM columns WHERE id = ?').get(card.column_id);
    db.prepare('DELETE FROM cards WHERE id = ?').run(req.params.id);
    if (col) req.app.get('io').to(`board:${col.board_id}`).emit('card:deleted', { id: req.params.id, column_id: card.column_id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/cards/:id/move
 * Move a card to a different column and/or position
 * Body: { column_id, position }
 */
router.patch('/:id/move', (req, res) => {
  try {
    const { column_id, position } = req.body;
    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    if (!card) return res.status(404).json({ success: false, error: 'Card not found' });

    const targetColumnId = column_id ?? card.column_id;
    db.prepare(
      'UPDATE cards SET column_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(targetColumnId, position ?? card.position, req.params.id);

    const updated = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    const parsed = { ...updated, labels: JSON.parse(updated.labels || '[]') };
    const col = db.prepare('SELECT board_id FROM columns WHERE id = ?').get(targetColumnId);
    if (col) req.app.get('io').to(`board:${col.board_id}`).emit('card:moved', parsed);
    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/cards/reorder
 * Bulk reorder cards within a column
 * Body: { column_id, cardIds: [id, ...] }
 */
router.patch('/reorder', (req, res) => {
  try {
    const { column_id, cardIds } = req.body;
    if (!column_id || !Array.isArray(cardIds)) {
      return res.status(400).json({ success: false, error: 'column_id and cardIds[] required' });
    }
    const update = db.prepare('UPDATE cards SET position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND column_id = ?');
    const updateAll = db.transaction((ids) => {
      ids.forEach((id, i) => update.run(i, id, column_id));
    });
    updateAll(cardIds);
    const col = db.prepare('SELECT board_id FROM columns WHERE id = ?').get(column_id);
    if (col) req.app.get('io').to(`board:${col.board_id}`).emit('cards:reordered', { column_id, cardIds });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
