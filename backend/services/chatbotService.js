const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
function getGeminiClient() {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

// Sinh câu trả lời tự nhiên dựa trên câu hỏi + danh sách sản phẩm liên quan (kỹ thuật RAG)
async function generateChatResponse(userQuestion, relevantProducts) {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: 'gemini-3.6-flash' });

  // Chuyển danh sách sản phẩm thành đoạn văn bản để "cho AI đọc"
  const productsContext = relevantProducts
    .map((p, i) => `${i + 1}. ${p.name} - Giá: ${Number(p.price).toLocaleString('vi-VN')}đ - ${p.description || 'Không có mô tả'}`)
    .join('\n');

  const prompt = `Bạn là trợ lý mua sắm thân thiện của một sàn thương mại điện tử.
Dưới đây là danh sách sản phẩm liên quan đến câu hỏi của khách hàng:
${productsContext}

Câu hỏi của khách hàng: "${userQuestion}"

Hãy trả lời ngắn gọn (2-4 câu), thân thiện, gợi ý sản phẩm phù hợp nhất từ danh sách trên, giải thích ngắn gọn vì sao phù hợp. CHỈ dùng thông tin từ danh sách trên, không bịa thêm sản phẩm không có trong danh sách. Trả lời bằng tiếng Việt.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

module.exports = { generateChatResponse };