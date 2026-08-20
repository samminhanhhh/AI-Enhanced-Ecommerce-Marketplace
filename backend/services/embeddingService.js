let embedder = null;

// Tải model AI - CHỈ tải 1 lần đầu tiên khi có request, các lần sau dùng lại
async function getEmbedder() {
  if (!embedder) {
    // pipeline() là hàm của transformers.js, tự tải model từ Hugging Face
    const { pipeline } = await import('@xenova/transformers');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedder;
}

// Chuyển 1 đoạn văn bản thành vector (mảng số)
async function generateEmbedding(text) {
  const model = await getEmbedder();
  const output = await model(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data); // chuyển về mảng số thường để lưu vào MySQL
}

// Tính độ tương đồng cosine giữa 2 vector
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

module.exports = { generateEmbedding, cosineSimilarity };