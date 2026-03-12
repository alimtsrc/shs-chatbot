// api/chatbot.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ reply: "No message provided" });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content: "You are a friendly SHS school guide AI for Unida Christian Colleges Inc. Answer student questions about strands, admission, tuition, and facilities."
          },
          { role: "user", content: message }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Groq error:", err);
      return res.status(500).json({ reply: "AI service error. Please try again." });
    }

    const data = await response.json();
    return res.status(200).json({ reply: data.choices[0].message.content });

  } catch (error) {
    console.error("Handler error:", error);
    return res.status(500).json({ reply: "Oops! Something went wrong with the AI." });
  }
}