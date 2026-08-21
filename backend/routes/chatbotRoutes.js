const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateEmbedding, cosineSimilarity } = require('../services/embeddingService');
const { generateChatResponse } = require('../services/chatbotService');

router.post('/', async (req, res) => {
  const { message } = req.body;
  if (!message || message.trim() === '') {
    return res.status(400).json({ message: 'Vui lòng nhập câu hỏi' });
  }

  try {
    // BƯỚC RETRIEVAL: dùng semantic search có sẵn để tìm sản phẩm liên quan
    const queryVector = await generateEmbedding(message);

    const sql = `SELECT p.id, p.name, p.description, p.price, p.stock,
                (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS primary_image,
                pe.vector
                FROM products p
                JOIN product_embeddings pe ON pe.product_id = p.id
                WHERE p.status = 'active'`;

    db.query(sql, async (err, products) => {
      if (err) return res.status(500).json({ message: 'Lỗi server' });

      const scored = products.map((p) => {
        const v = typeof p.vector === 'string' ? JSON.parse(p.vector) : p.vector;
        const score = cosineSimilarity(queryVector, v);
        const { vector, ...data } = p;
        return { ...data, similarity: score };
      });

      scored.sort((a, b) => b.similarity - a.similarity);
      const topProducts = scored.filter((p) => p.similarity > 0.45).slice(0, 5);
// Không return sớm nữa - luôn cho Gemini xử lý, vì Gemini giờ đã biết cách trả lời
// cả câu hỏi chung (không liên quan sản phẩm) nhờ SITE_INFO trong prompt

      // BƯỚC GENERATION: thử gọi Gemini để có câu trả lời tự nhiên
      try {
        const aiReply = await generateChatResponse(message, topProducts);
        res.json({ reply: aiReply, products: topProducts, usedAI: true });
      } catch (aiError) {
        // FALLBACK: nếu Gemini lỗi (mất mạng, hết quota...) - vẫn trả về sản phẩm, không có văn AI
        console.error('Lỗi gọi Gemini, dùng fallback:', aiError.message);
        res.json({
          reply: `Đây là ${topProducts.length} sản phẩm phù hợp với yêu cầu của bạn:`,
          products: topProducts,
          usedAI: false
        });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi khi xử lý câu hỏi' });
  }
});

module.exports = router;