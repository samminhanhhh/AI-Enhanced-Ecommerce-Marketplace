const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { generateEmbedding, cosineSimilarity } = require('../services/embeddingService');
 
// Hàm dùng chung: sinh embedding cho 1 sản phẩm (kèm tên danh mục) và lưu vào DB
function generateAndSaveEmbedding(productId, name, description, categoryName, callback) {
  const textToEmbed = `${name}. ${description || ''}. Danh mục: ${categoryName || ''}`;
  generateEmbedding(textToEmbed)
    .then((vector) => {
      const vectorJson = JSON.stringify(vector);
      db.query(
        `INSERT INTO product_embeddings (product_id, vector) VALUES (?, ?) ON DUPLICATE KEY UPDATE vector = ?`,
        [productId, vectorJson, vectorJson],
        (err) => callback(err)
      );
    })
    .catch((err) => callback(err));
}
 
// POST - Đăng sản phẩm mới (CHỈ seller) - TỰ ĐỘNG sinh embedding kèm tên danh mục
router.post('/', verifyToken, checkRole(['seller']), (req, res) => {
  const { name, description, price, stock, category_id } = req.body;
  const seller_id = req.user.id; // lấy từ token, KHÔNG tin dữ liệu người dùng tự gửi lên
 
  if (!name || !price || !category_id) {
    return res.status(400).json({ message: 'Vui lòng nhập đủ tên, giá, danh mục' });
  }
 
  const sql = `INSERT INTO products (seller_id, category_id, name, description, price, stock, status)
               VALUES (?, ?, ?, ?, ?, ?, 'pending')`;
  db.query(sql, [seller_id, category_id, name, description || null, price, stock || 0], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Lỗi server' });
    }
 
    const newProductId = result.insertId;
 
    // Lấy tên danh mục để nhúng cùng vào embedding
    db.query('SELECT name FROM categories WHERE id = ?', [category_id], (catErr, catResults) => {
      const categoryName = catResults && catResults[0] ? catResults[0].name : '';
      generateAndSaveEmbedding(newProductId, name, description, categoryName, (embErr) => {
        if (embErr) console.error('Lỗi sinh embedding tự động:', embErr);
        // Dù embedding lỗi, vẫn báo đăng sản phẩm thành công - không chặn luồng chính
        res.status(201).json({ message: 'Đăng sản phẩm thành công', productId: newProductId });
      });
    });
  });
});
 
// GET - Tìm kiếm ngữ nghĩa (Semantic Search) - USP của đồ án
// LƯU Ý: đặt route này TRƯỚC "GET /:id" để tránh bị nhầm "search" thành 1 id
router.get('/search/semantic', async (req, res) => {
  const { q } = req.query;
 
  if (!q || q.trim() === '') {
    return res.status(400).json({ message: 'Vui lòng nhập từ khóa tìm kiếm' });
  }
 
  try {
    const queryVector = await generateEmbedding(q);
 
    const sql = `SELECT p.id, p.name, p.description, p.price, p.stock, p.category_id,
                c.name AS category_name, u.name AS seller_name,
                (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS primary_image,
                pe.vector
                FROM products p
                JOIN categories c ON p.category_id = c.id
                JOIN users u ON p.seller_id = u.id
                JOIN product_embeddings pe ON pe.product_id = p.id
                WHERE p.status = 'active'`;
 
    db.query(sql, (err, products) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi server' });
      }
 
      const resultsWithScore = products.map((p) => {
        const productVector = typeof p.vector === 'string' ? JSON.parse(p.vector) : p.vector;
        const score = cosineSimilarity(queryVector, productVector);
        const { vector, ...productData } = p;
        return { ...productData, similarity: score };
      });
 
      resultsWithScore.sort((a, b) => b.similarity - a.similarity);
 
      const relevantResults = resultsWithScore.filter((p) => p.similarity > 0.3);
 
      if (relevantResults.length > 0) {
        return res.json({ results: relevantResults, exactMatch: true });
      }
 
      // Không có kết quả đủ liên quan -> trả về top 5 gần nhất, kèm cờ báo hiệu
      const fallbackResults = resultsWithScore.slice(0, 5);
      res.json({ results: fallbackResults, exactMatch: false });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi khi tìm kiếm' });
  }
});
 
// POST - Sinh (hoặc cập nhật) embedding cho 1 sản phẩm - dùng thủ công / bù dữ liệu cũ
router.post('/:id/generate-embedding', verifyToken, checkRole(['seller', 'admin']), (req, res) => {
  const productId = req.params.id;
 
  const sql = `SELECT p.name, p.description, c.name AS category_name
               FROM products p JOIN categories c ON p.category_id = c.id
               WHERE p.id = ?`;
  db.query(sql, [productId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
 
    const product = results[0];
    generateAndSaveEmbedding(productId, product.name, product.description, product.category_name, (embErr) => {
      if (embErr) {
        console.error(embErr);
        return res.status(500).json({ message: 'Lỗi khi tạo embedding' });
      }
      res.json({ message: 'Đã tạo embedding cho sản phẩm' });
    });
  });
});
 
// GET - Xem danh sách sản phẩm (có kèm ảnh đại diện, lọc theo category/tên)
router.get('/', (req, res) => {
  const { category_id, search } = req.query;
 
  let sql = `SELECT p.*, c.name AS category_name, u.name AS seller_name,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS primary_image
             FROM products p
             JOIN categories c ON p.category_id = c.id
             JOIN users u ON p.seller_id = u.id
             WHERE p.status = 'active'`;
  const params = [];
 
  if (category_id) {
    sql += ' AND p.category_id = ?';
    params.push(category_id);
  }
  if (search) {
    sql += ' AND p.name LIKE ?';
    params.push(`%${search}%`);
  }
 
  db.query(sql, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Lỗi server' });
    }
    res.json(results);
  });
});
 
// GET - Xem chi tiết 1 sản phẩm theo id
router.get('/:id', (req, res) => {
  const sql = `SELECT p.*, c.name AS category_name, u.name AS seller_name,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS primary_image
             FROM products p
             JOIN categories c ON p.category_id = c.id
             JOIN users u ON p.seller_id = u.id
             WHERE p.id = ?`;
  db.query(sql, [req.params.id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Lỗi server' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    res.json(results[0]);
  });
});

// GET - Gợi ý sản phẩm tương tự (dựa trên embedding đã có sẵn)
router.get('/:id/similar', (req, res) => {
  const productId = req.params.id;

  db.query('SELECT vector FROM product_embeddings WHERE product_id = ?', [productId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (results.length === 0) return res.status(404).json({ message: 'Sản phẩm chưa có dữ liệu AI' });

    const targetVector = typeof results[0].vector === 'string' ? JSON.parse(results[0].vector) : results[0].vector;

    const sql = `SELECT p.id, p.name, p.price, p.stock, c.name AS category_name,
                (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS primary_image,
                pe.vector
                FROM products p
                JOIN categories c ON p.category_id = c.id
                JOIN product_embeddings pe ON pe.product_id = p.id
                WHERE p.status = 'active' AND p.id != ?`;

    db.query(sql, [productId], (err, products) => {
      if (err) return res.status(500).json({ message: 'Lỗi server' });

      const scored = products.map((p) => {
        const v = typeof p.vector === 'string' ? JSON.parse(p.vector) : p.vector;
        const score = cosineSimilarity(targetVector, v);
        const { vector, ...data } = p;
        return { ...data, similarity: score };
      });

      scored.sort((a, b) => b.similarity - a.similarity);
      res.json(scored.slice(0, 4)); // top 4 sản phẩm giống nhất
    });
  });
});
 
// PUT - Sửa sản phẩm (CHỈ seller SỞ HỮU sản phẩm đó) - cập nhật lại embedding luôn
router.put('/:id', verifyToken, checkRole(['seller']), (req, res) => {
  const { name, description, price, stock } = req.body;
  const productId = req.params.id;
 
  db.query('SELECT seller_id FROM products WHERE id = ?', [productId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    if (results[0].seller_id !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền sửa sản phẩm này' });
    }
 
    const sql = 'UPDATE products SET name=?, description=?, price=?, stock=? WHERE id=?';
    db.query(sql, [name, description, price, stock, productId], (err) => {
      if (err) return res.status(500).json({ message: 'Lỗi server' });
 
      // Lấy category hiện tại của sản phẩm để nhúng vào embedding
      db.query(
        `SELECT c.name AS category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?`,
        [productId],
        (catErr, catResults) => {
          const categoryName = catResults && catResults[0] ? catResults[0].category_name : '';
          generateAndSaveEmbedding(productId, name, description, categoryName, (embErr) => {
            if (embErr) console.error('Lỗi cập nhật embedding:', embErr);
            res.json({ message: 'Cập nhật sản phẩm thành công' });
          });
        }
      );
    });
  });
});
 
// DELETE - Xóa sản phẩm (CHỈ seller SỞ HỮU sản phẩm đó)
router.delete('/:id', verifyToken, checkRole(['seller']), (req, res) => {
  const productId = req.params.id;
 
  db.query('SELECT seller_id FROM products WHERE id = ?', [productId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    if (results[0].seller_id !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa sản phẩm này' });
    }
 
    db.query('DELETE FROM products WHERE id = ?', [productId], (err) => {
      if (err) return res.status(500).json({ message: 'Lỗi server' });
      res.json({ message: 'Xóa sản phẩm thành công' });
    });
  });
});
 
// POST - Upload ảnh cho 1 sản phẩm (CHỈ seller sở hữu)
router.post('/:id/images', verifyToken, checkRole(['seller']), upload.single('image'), (req, res) => {
  const productId = req.params.id;
 
  if (!req.file) {
    return res.status(400).json({ message: 'Vui lòng chọn file ảnh' });
  }
 
  db.query('SELECT seller_id FROM products WHERE id = ?', [productId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    if (results[0].seller_id !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền thêm ảnh cho sản phẩm này' });
    }
 
    db.query('SELECT COUNT(*) AS total FROM product_images WHERE product_id = ?', [productId], (err, countResult) => {
      if (err) return res.status(500).json({ message: 'Lỗi server' });
      const isFirstImage = countResult[0].total === 0;
 
      const imageUrl = `/uploads/${req.file.filename}`;
      db.query(
        'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)',
        [productId, imageUrl, isFirstImage],
        (err, result) => {
          if (err) return res.status(500).json({ message: 'Lỗi server' });
          res.status(201).json({ message: 'Upload ảnh thành công', imageUrl });
        }
      );
    });
  });
});
 
// GET - Lấy tất cả ảnh của 1 sản phẩm
router.get('/:id/images', (req, res) => {
  db.query('SELECT * FROM product_images WHERE product_id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    res.json(results);
  });
});
 
// POST - Seller thêm biến thể cho sản phẩm
router.post('/:id/variants', verifyToken, checkRole(['seller']), (req, res) => {
  const { variant_name, price_extra } = req.body;
  const productId = req.params.id;
  if (!variant_name) return res.status(400).json({ message: 'Vui lòng nhập tên biến thể' });

  db.query('SELECT seller_id FROM products WHERE id = ?', [productId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    if (results[0].seller_id !== req.user.id) return res.status(403).json({ message: 'Không có quyền' });

    db.query('INSERT INTO product_variants (product_id, variant_name, price_extra) VALUES (?, ?, ?)',
      [productId, variant_name, price_extra || 0], (err, result) => {
        if (err) return res.status(500).json({ message: 'Lỗi server' });
        res.status(201).json({ message: 'Đã thêm biến thể', variantId: result.insertId });
      });
  });
});

// GET - Xem biến thể của 1 sản phẩm (công khai)
router.get('/:id/variants', (req, res) => {
  db.query('SELECT * FROM product_variants WHERE product_id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    res.json(results);
  });
});

// DELETE - Xóa 1 biến thể (seller sở hữu)
router.delete('/variants/:variantId', verifyToken, checkRole(['seller']), (req, res) => {
  const sql = `SELECT p.seller_id FROM product_variants pv JOIN products p ON pv.product_id = p.id WHERE pv.id = ?`;
  db.query(sql, [req.params.variantId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy biến thể' });
    if (results[0].seller_id !== req.user.id) return res.status(403).json({ message: 'Không có quyền' });
    db.query('DELETE FROM product_variants WHERE id = ?', [req.params.variantId], (err) => {
      if (err) return res.status(500).json({ message: 'Lỗi server' });
      res.json({ message: 'Đã xóa biến thể' });
    });
  });
});

module.exports = router;