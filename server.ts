import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Google GenAI with API key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 images
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Route: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API Route: AI Grading & OCR for Essay submissions
  app.post("/api/gemini/grade", async (req, res) => {
    try {
      const { title, description, criteria, studentAnswer, studentImages, criteriaImages } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: "GEMINI_API_KEY is not configured on the server. Please add it in Settings > Secrets." 
        });
      }

      // Build Gemini Prompt and Parts
      const promptText = `
Hãy chấm điểm bài tự luận tiểu học sau đây:
[ĐỂ BÀI]
Tiêu đề: ${title || "Chưa có"}
Nội dung đề: ${description || "Chưa có"}

[ĐÁP ÁN CHUẨN / HƯỚNG DẪN CHẤM CỦA GIÁO VIÊN]
${criteria || "Chưa có"}

[BÀI LÀM CỦA HỌC SINH (GÕ CHỮ)]
${studentAnswer || "Học sinh không gõ chữ, hãy xem hình ảnh bài làm đính kèm bên dưới"}

[YÊU CẦU CHẤM BÀI]
1. Đọc và hiểu kỹ đề bài cùng đáp án chuẩn/tiêu chí chấm.
2. Nếu học sinh có đính kèm ảnh bài viết tay, hãy sử dụng tính năng nhận diện chữ viết tay (OCR) chất lượng cao để trích xuất và đọc nội dung chữ viết trong các bức ảnh đó.
3. So sánh câu trả lời của học sinh (phần chữ gõ lẫn chữ viết tay OCR được) với đáp án mẫu.
4. Đánh giá cẩn thận xem học sinh làm: Đúng ý nào? Sai ý nào? Thiếu sót ý nào? Có bị sai phương pháp giải không? Có bị lỗi chính tả/ngữ pháp không? Phép tính toán có bị nhầm lẫn không?
5. Cho điểm số thực tế trên thang điểm 10 (thang điểm chuẩn, ví dụ 8 hoặc 8.5 hoặc 9.2).
6. Viết lời nhận xét chi tiết, khen ngợi những phần làm tốt và khuyến khích bé học tập (phù hợp với học sinh tiểu học, ấm áp, tận tụy).
7. Chỉ rõ cách sửa lỗi sai chi tiết từng chỗ.
8. Đưa ra lời khuyên học tập quý giá.

Bạn phải trả về phản hồi dưới dạng đối tượng JSON tuân thủ chính xác Schema cấu trúc đã được cấu hình bên dưới.
`;

      const contents: any[] = [];
      contents.push({ text: promptText });

      // Append student answer images if available
      if (studentImages && Array.isArray(studentImages)) {
        studentImages.forEach((imgBase64: string) => {
          if (!imgBase64) return;
          let mimeType = "image/jpeg";
          let data = imgBase64;
          if (imgBase64.startsWith("data:")) {
            const match = imgBase64.match(/^data:([^;]+);base64,(.*)$/);
            if (match) {
              mimeType = match[1];
              data = match[2];
            }
          }
          contents.push({
            inlineData: {
              mimeType,
              data
            }
          });
        });
      }

      // Append teacher criteria images if available
      if (criteriaImages && Array.isArray(criteriaImages)) {
        criteriaImages.forEach((imgBase64: string) => {
          if (!imgBase64) return;
          let mimeType = "image/jpeg";
          let data = imgBase64;
          if (imgBase64.startsWith("data:")) {
            const match = imgBase64.match(/^data:([^;]+);base64,(.*)$/);
            if (match) {
              mimeType = match[1];
              data = match[2];
            }
          }
          contents.push({
            inlineData: {
              mimeType,
              data
            }
          });
        });
      }

      // Call Gemini 3.5 Flash Model
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: contents },
        config: {
          systemInstruction: "Bạn là một Giáo viên Tiểu học và là Chuyên gia Khảo thí Giáo dục xuất sắc. Bạn chấm bài tự luận chân thực, sử dụng OCR đọc hình ảnh bài viết tay, đánh giá tỉ mỉ các khía cạnh đúng sai, và trả về định dạng JSON theo đúng schema.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER, description: "Điểm số thực tế (thang điểm 10, làm tròn tối đa đến 1 chữ số thập phân, ví dụ 8.5)" },
              maxScore: { type: Type.NUMBER, description: "Điểm tối đa là 10" },
              correctAnswers: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }, 
                description: "Danh sách các điểm sáng, ý làm đúng, phép tính đúng hoặc cách lập luận tốt của học sinh" 
              },
              incorrectAnswers: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }, 
                description: "Danh sách lỗi sai, ý thiếu, lỗi chính tả, sai phép tính hoặc hiểu sai phương pháp" 
              },
              comments: { type: Type.STRING, description: "Nhận xét tổng thể ân cần, khuyến khích học sinh" },
              suggestions: { type: Type.STRING, description: "Hướng dẫn giải chi tiết và cách khắc phục lỗi sai" },
              learningAdvice: { type: Type.STRING, description: "Lời khuyên rèn luyện thêm, chủ đề cần ôn tập" }
            },
            required: ["score", "maxScore", "correctAnswers", "incorrectAnswers", "comments", "suggestions", "learningAdvice"]
          }
        }
      });

      const responseText = response.text || "{}";
      const resultObj = JSON.parse(responseText.trim());
      res.json(resultObj);

    } catch (error: any) {
      console.error("AI Grading Error:", error);
      res.status(500).json({ error: error?.message || "Đã xảy ra lỗi khi AI chấm bài tự động." });
    }
  });

  // API Route: AI Learning Assistant to generate assignments
  app.post("/api/gemini/assistant", async (req, res) => {
    try {
      const { prompt, subject, week, lessonContent, uploadedImages } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: "GEMINI_API_KEY is not configured on the server. Please add it in Settings > Secrets." 
        });
      }

      const promptText = `
Hãy đóng vai trò là một Chuyên gia Soạn bài và Thiết kế Học liệu số Tiểu học. Nhiệm vụ của bạn là tạo ra một bài tập rèn luyện (gồm 3-5 câu hỏi) chất lượng cao cho học sinh, dựa trên các thông tin sau:
- Môn học: ${subject || "Tự chọn"}
- Tuần học: Tuần ${week || 1}
- Nội dung bài học/Tài liệu tham khảo: ${lessonContent || "Chưa cung cấp văn bản cụ thể"}
- Yêu cầu của Giáo viên: "${prompt || "Hãy tạo bài ôn tập bám sát chương trình học"}"

[YÊU CẦU THIẾT KẾ]
Bạn cần sinh ra một tiêu đề bài tập, mô tả dặn dò, và một danh sách từ 3 đến 5 câu hỏi có mức độ phong phú (hỗ trợ cả trắc nghiệm, đúng sai, điền từ, nối, tự luận).
Mỗi câu hỏi phải có cấu trúc phù hợp với loại hình của nó:
- single_choice (Trắc nghiệm một lựa chọn): yêu cầu có mảng 'options' (gồm 4 lựa chọn A, B, C, D) và 'correctAnswer' (chữ cái A, B, C hoặc D).
- true_false (Đúng sai): yêu cầu có mảng 'trueFalseOptions' chứa các đối tượng { text: string, correct: boolean }.
- matching (Nối cặp): yêu cầu có 'matchingLeft' (danh sách vế trái), 'matchingRight' (danh sách vế phải), và 'matchingPairs' là đối tượng map từ vế trái sang vế phải tương ứng.
- fill_blank (Điền vào chỗ trống): yêu cầu có 'blanksText' chứa đoạn văn có dấu '...' để điền, 'blankChoices' chứa các từ gợi ý để chọn, và 'blankAnswers' chứa mảng các từ đáp án đúng theo thứ tự các dấu '...'.
- essay (Tự luận): yêu cầu nhập đề bài tự luận, và cung cấp 'criteria' là đáp án chuẩn hoặc hướng dẫn chấm chi tiết.

Bạn PHẢI trả về kết quả dưới định dạng JSON khớp chính xác với cấu trúc của Schema được cấu hình bên dưới.
`;

      const contents: any[] = [];
      contents.push({ text: promptText });

      // Append textbook/lesson plan images if available
      if (uploadedImages && Array.isArray(uploadedImages)) {
        uploadedImages.forEach((imgBase64: string) => {
          if (!imgBase64) return;
          let mimeType = "image/jpeg";
          let data = imgBase64;
          if (imgBase64.startsWith("data:")) {
            const match = imgBase64.match(/^data:([^;]+);base64,(.*)$/);
            if (match) {
              mimeType = match[1];
              data = match[2];
            }
          }
          contents.push({
            inlineData: {
              mimeType,
              data
            }
          });
        });
      }

      // Generate content with structured JSON
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: contents },
        config: {
          systemInstruction: "Bạn là một AI Trợ lý học liệu tiểu học thông minh. Bạn soạn đề bài tập tương tác sáng tạo, chính xác, bám sát sách giáo khoa và trả về kết quả JSON theo đúng schema.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Tiêu đề hấp dẫn cho bài tập (ví dụ: Chuyên đề phép nhân phân số Tuần 3)" },
              description: { type: Type.STRING, description: "Lời dặn dò ngắn gọn, khuyến khích học sinh làm bài" },
              subject: { type: Type.STRING, description: "Tên môn học (như Toán, Tiếng Việt, Tiếng Anh, TNXH, Khoa học, Lịch sử, Địa lý...)" },
              week: { type: Type.INTEGER, description: "Số tuần học (từ 1 đến 35)" },
              rewardStars: { type: Type.INTEGER, description: "Số sao thưởng đề xuất (ví dụ: 10)" },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "ID tự sinh dạng q_1, q_2..." },
                    type: { 
                      type: Type.STRING, 
                      description: "Loại câu hỏi: 'single_choice', 'true_false', 'matching', 'fill_blank', 'essay'" 
                    },
                    questionText: { type: Type.STRING, description: "Nội dung câu hỏi rành mạch, dễ hiểu" },
                    options: { 
                      type: Type.ARRAY, 
                      items: { type: Type.STRING }, 
                      description: "Mảng 4 đáp án cho trắc nghiệm (A, B, C, D)" 
                    },
                    correctAnswer: { type: Type.STRING, description: "Chữ cái đáp án đúng (ví dụ: A)" },
                    trueFalseOptions: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          text: { type: Type.STRING },
                          correct: { type: Type.BOOLEAN }
                        },
                        required: ["text", "correct"]
                      },
                      description: "Danh sách mệnh đề Đúng/Sai"
                    },
                    matchingLeft: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Danh sách cột trái" },
                    matchingRight: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Danh sách cột phải" },
                    matchingPairs: { 
                      type: Type.OBJECT, 
                      description: "Đối tượng biểu diễn nối vế trái -> vế phải đúng" 
                    },
                    blanksText: { type: Type.STRING, description: "Đoạn văn chứa dấu '...' để học sinh điền" },
                    blankChoices: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Mảng từ gợi ý" },
                    blankAnswers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Mảng đáp án đúng theo thứ tự chỗ trống" },
                    criteria: { type: Type.STRING, description: "Hướng dẫn chấm chi tiết hoặc lời giải mẫu (dành cho câu hỏi tự luận)" },
                    maxScore: { type: Type.NUMBER, description: "Điểm số tối đa của câu hỏi này" }
                  },
                  required: ["id", "type", "questionText"]
                }
              }
            },
            required: ["title", "description", "subject", "week", "rewardStars", "questions"]
          }
        }
      });

      const responseText = response.text || "{}";
      const resultObj = JSON.parse(responseText.trim());
      res.json(resultObj);

    } catch (error: any) {
      console.error("AI Learning Assistant Error:", error);
      res.status(500).json({ error: error?.message || "Đã xảy ra lỗi khi AI soạn bài học liệu." });
    }
  });

  // API Route: AI Student Chat Tutor for answering follow-ups
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { assignmentTitle, questionText, studentAnswer, comments, chatHistory, userMessage } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: "GEMINI_API_KEY is not configured on the server. Please add it in Settings > Secrets." 
        });
      }

      const chatSession = ai.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction: `Bạn là "Cô giáo Trợ lý AI" đáng yêu, kiên nhẫn và tận tụy, đóng vai trò gia sư cá nhân 1-1 cho một học sinh tiểu học.
Học sinh đang hỏi bạn về một bài tập tự luận mà em vừa làm và đã được bạn chấm điểm.
[BỐI CẢNH BÀI LÀM]
- Bài tập: ${assignmentTitle || "Bài tập tự luận"}
- Đề bài/Câu hỏi: ${questionText || "Chưa rõ"}
- Bài làm của học sinh: ${studentAnswer || "Chưa rõ"}
- Điểm & Nhận xét ban đầu của AI: ${comments || "Chưa rõ"}

Nhiệm vụ của bạn:
- Hãy trả lời các thắc mắc của học sinh bằng giọng văn vô cùng ấm áp, dễ thương, gọi học sinh là "con" hoặc "em" và xưng "cô".
- Sử dụng ngôn ngữ dễ hiểu đối với lứa tuổi tiểu học, giải thích tường tận lỗi sai một cách khéo léo để không làm bé nản chí.
- Trình bày sinh động, dùng các biểu tượng vui tươi (🌟, 📚, ❤️, 🎉) để thu hút bé.
- Khuyến khích bé tự suy nghĩ và hỏi lại nếu chưa hiểu.`,
          temperature: 0.7,
        }
      });

      // Populate history if provided
      if (chatHistory && Array.isArray(chatHistory)) {
        // Send history messages one by one to session or reconstruct them
        // In @google/genai, ai.chats can be loaded with history, or we can format history into a single cohesive message.
        // For simplicity and bulletproof execution, we can supply the entire history context directly into the chat prompt or message structure.
      }

      const historyContext = (chatHistory || [])
        .map((m: any) => `${m.role === 'user' ? 'Học sinh' : 'Cô giáo AI'}: ${m.text}`)
        .join("\n");

      const promptMessage = `
[LỊCH SỬ TRÒ CHUYỆN]
${historyContext || "Chưa có trò chuyện trước đó"}

[CÂU HỎI MỚI CỦA HỌC SINH]
Học sinh: "${userMessage}"

Cô giáo AI hãy phản hồi trực tiếp:
`;

      const response = await chatSession.sendMessage({ message: promptMessage });
      res.json({ text: response.text });

    } catch (error: any) {
      console.error("AI Student Chat Error:", error);
      res.status(500).json({ error: error?.message || "Đã xảy ra lỗi khi kết nối với Cô giáo AI." });
    }
  });

  // Serve static files in production or hook up Vite middleware in development
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[LMS SERVER] Full Stack Server booted successfully!`);
    console.log(`[LMS SERVER] Local URL: http://localhost:${PORT}`);
  });
}

startServer();
