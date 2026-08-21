const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// POST - Buyer bắt đầu (hoặc lấy lại) cuộc trò chuyện với 1 seller
router.post('/start', verifyToken, checkRole(['buyer']), (req, res) => {
  const { seller_id } = req.body;
  const buyerId = req.user.id;

  if (!seller_id) return res.status(400).json({ message: 'Thiếu thông tin cửa hàng' });

  db.query('SELECT id FROM conversations WHERE buyer_id = ? AND seller_id = ?', [buyerId, seller_id], (err, existing) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (existing.length > 0) {
      return res.json({ conversationId: existing[0].id });
    }
    db.query('INSERT INTO conversations (buyer_id, seller_id) VALUES (?, ?)', [buyerId, seller_id], (err, result) => {
      if (err) return res.status(500).json({ message: 'Lỗi server' });
      res.json({ conversationId: result.insertId });
    });
  });
});

// GET - Danh sách cuộc trò chuyện của tôi (dùng chung cho cả buyer và seller)
router.get('/', verifyToken, (req, res) => {
  const userId = req.user.id;
  const sql = `SELECT c.id, c.buyer_id, c.seller_id,
              CASE WHEN c.buyer_id = ? THEN us.name ELSE ub.name END AS other_name,
              (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
              (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_time
              FROM conversations c
              JOIN users ub ON c.buyer_id = ub.id
              JOIN users us ON c.seller_id = us.id
              WHERE c.buyer_id = ? OR c.seller_id = ?
              ORDER BY last_time DESC`;
  db.query(sql, [userId, userId, userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    res.json(results);
  });
});

// GET - Lấy toàn bộ tin nhắn trong 1 cuộc trò chuyện (phải là 1 trong 2 người tham gia)
router.get('/:id', verifyToken, (req, res) => {
  const conversationId = req.params.id;
  const userId = req.user.id;

  db.query('SELECT * FROM conversations WHERE id = ?', [conversationId], (err, conv) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (conv.length === 0) return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    if (conv[0].buyer_id !== userId && conv[0].seller_id !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền xem cuộc trò chuyện này' });
    }

    db.query('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC', [conversationId], (err, messages) => {
      if (err) return res.status(500).json({ message: 'Lỗi server' });
      res.json(messages);
    });
  });
});

// POST - Gửi tin nhắn vào 1 cuộc trò chuyện
router.post('/:id', verifyToken, (req, res) => {
  const conversationId = req.params.id;
  const userId = req.user.id;
  const { content } = req.body;

  if (!content || content.trim() === '') return res.status(400).json({ message: 'Nội dung không được để trống' });

  db.query('SELECT * FROM conversations WHERE id = ?', [conversationId], (err, conv) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (conv.length === 0) return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    if (conv[0].buyer_id !== userId && conv[0].seller_id !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền gửi tin nhắn ở đây' });
    }

    db.query('INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)', [conversationId, userId, content], (err) => {
      if (err) return res.status(500).json({ message: 'Lỗi server' });
      res.status(201).json({ message: 'Đã gửi' });
    });
  });
});

module.exports = router;