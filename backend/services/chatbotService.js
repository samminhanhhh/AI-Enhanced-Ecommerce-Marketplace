const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
function getGeminiClient() {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

// Thông tin cơ bản về website - giúp AI trả lời được câu hỏi KHÔNG liên quan tìm sản phẩm
const SITE_INFO = `
Thông tin về sàn thương mại điện tử ShopShop:
- Đăng ký tài khoản: nhấn nút "Đăng ký" ở góc trên bên phải, điền tên, email, mật khẩu và chọn vai trò (Người mua hoặc Người bán).
- Đăng nhập: nhấn "Đăng nhập", nhập email và mật khẩu đã đăng ký.
- Thanh toán: hỗ trợ tiền mặt khi nhận hàng (COD), chuyển khoản ngân hàng, và ví Momo (quét mã QR khi checkout).
- Theo dõi đơn hàng: vào mục "Đơn hàng của tôi" sau khi đăng nhập.
- Đánh giá sản phẩm: chỉ thực hiện được sau khi đã mua sản phẩm đó, tại trang chi tiết sản phẩm.
`;

async function generateChatResponse(userQuestion, relevantProducts) {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({ model: 'gemini-3.6-flash' });

  const productsContext = relevantProducts.length > 0
    ? relevantProducts
        .map((p, i) => `${i + 1}. ${p.name} - Giá: ${Number(p.price).toLocaleString('vi-VN')}đ - ${p.description || 'Không có mô tả'}`)
        .join('\n')
    : '(Không có sản phẩm nào đủ liên quan đến câu hỏi này)';

  const prompt = `Bạn là trợ lý ảo của sàn thương mại điện tử ShopShop, hỗ trợ cả việc TÌM SẢN PHẨM và GIẢI ĐÁP THẮC MẮC về cách dùng website.

${SITE_INFO}

Danh sách sản phẩm có thể liên quan đến câu hỏi (chỉ dùng nếu thực sự phù hợp):
${productsContext}

Câu hỏi của khách hàng: "${userQuestion}"

QUY TẮC TRẢ LỜI:
- Nếu câu hỏi là về CÁCH SỬ DỤNG WEBSITE (đăng ký, đăng nhập, thanh toán, theo dõi đơn hàng...): trả lời dựa vào phần "Thông tin về sàn thương mại điện tử" ở trên, KHÔNG nhắc đến danh sách sản phẩm.
- Nếu câu hỏi là TÌM KIẾM SẢN PHẨM và danh sách trên có sản phẩm phù hợp: gợi ý sản phẩm đó, giải thích ngắn gọn vì sao phù hợp.
- Nếu câu hỏi TÌM SẢN PHẨM nhưng danh sách không có gì thực sự liên quan: xin lỗi và nói chưa tìm thấy sản phẩm phù hợp, không được ép gợi ý sản phẩm không liên quan.
- Trả lời ngắn gọn (2-4 câu), thân thiện, bằng tiếng Việt.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

module.exports = { generateChatResponse };