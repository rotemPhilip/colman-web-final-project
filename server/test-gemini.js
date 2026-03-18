require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");

async function testGemini() {
    // 1. בדיקה שהמפתח נטען מה-env
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        console.error("❌ שגיאה: המפתח לא נמצא בקובץ .env!");
        return;
    }

    console.log("🔑 API Key loaded:", `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`);

    // 2. אתחול ה-SDK (same package the server uses: @google/genai)
    const genAI = new GoogleGenAI({ apiKey });

    try {
        console.log("⏳ שולח בקשה לגוגל...");
        
        const prompt = "Write a short hello message.";
        const result = await genAI.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        const text = result.text ?? "";

        console.log("✅ הצלחה! התשובה מהמודל:");
        console.log("-------------------");
        console.log(text);
        console.log("-------------------");

    } catch (error) {
        console.error("❌ קרתה שגיאה בזמן הפנייה ל-API:");
        
        if (error.response) {
            console.error("Status:", error.status);
            console.error("Message:", error.message);
        } else {
            console.error(error);
        }
    }
}

testGemini();
