// api/chatbot.js
import fetch from "node-fetch";  // Vercel requires node-fetch for serverless functions

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { message } = req.body; // message from frontend

    try {
      // Call Groq API
      const response = await fetch("https://api.groq.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`, // API key from Vercel env
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-8b-8192", // recommended for SHS info
          messages: [
            { role: "system", content: "You are a friendly SHS school guide AI. Answer student questions about strands, admission, tuition, and facilities." },
            { role: "user", content: message }
          ]
        })
      });

      const data = await response.json();

      // Send AI response back to frontend
      res.status(200).json({ reply: data.choices[0].message.content });
    } catch (error) {
      console.error(error);
      res.status(500).json({ reply: "Oops! Something went wrong with the AI." });
    }

  } else {
    res.status(405).json({ reply: "Method not allowed" });
  }
}