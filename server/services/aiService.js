import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

let openai;
let gemini;
let openrouter;

export const initAIServices = () => {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  if (process.env.GEMINI_API_KEY) {
     gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  if (process.env.OPENROUTER_API_KEY) {
    openrouter = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:5173", // Optional, for OpenRouter rankings
        "X-Title": "Hallucination Detector", // Optional
      }
    });
  }
};

export const generateResponse = async (prompt, model, historyContext = []) => {
  try {
    if (model === 'openai') {
      if (!openai) throw new Error("OpenAI API Key not configured.");
      
      const sanitizedHistory = (historyContext || []).map(msg => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.content
      }));

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
            ...sanitizedHistory,
            { role: "user", content: prompt }
        ],
      });
      return response.choices[0].message.content;
      
    } else if (model === 'gemini') {
      if (!gemini) throw new Error("Gemini API Key not configured.");
      
      try {
        const genModel = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const formattedHistory = (historyContext || []).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: String(msg.content || "") }]
        }));

        const chatSession = genModel.startChat({
            history: formattedHistory
        });

        const response = await chatSession.sendMessage(prompt);
        return response.response.text();
      } catch (err) {
        console.warn("Direct Gemini call failed, falling back to OpenRouter:", err.message);
        if (!openrouter) throw err;
        
        // Fallback to OpenRouter using Gemini 2.0
        const sanitizedHistory = (historyContext || []).map(msg => ({
          role: msg.role === 'model' ? 'assistant' : msg.role,
          content: msg.content
        }));

        const response = await openrouter.chat.completions.create({
          model: "google/gemini-2.0-flash-001",
          messages: [
            ...sanitizedHistory,
            { role: "user", content: prompt }
          ],
        });
        return response.choices[0].message.content;
      }

    } else if (model === 'openrouter') {
      if (!openrouter) throw new Error("OpenRouter API Key not configured.");

      // Map roles: OpenAI/OpenRouter expect 'assistant', not 'model'
      const sanitizedHistory = (historyContext || []).map(msg => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.content
      }));

      const modelId = "google/gemini-2.0-flash-001"; 
      
      try {
        const response = await openrouter.chat.completions.create({
          model: modelId,
          messages: [
            ...sanitizedHistory,
            { role: "user", content: prompt }
          ],
        });
        return response.choices[0].message.content;
      } catch (err) {
        console.warn(`Primary OpenRouter model ${modelId} failed, trying fallback...`);
        const fallbackResponse = await openrouter.chat.completions.create({
          model: "openrouter/free",
          messages: [
            ...sanitizedHistory,
            { role: "user", content: prompt }
          ],
        });
        return fallbackResponse.choices[0].message.content;
      }
      
    } else {
      throw new Error(`Unsupported model: ${model}`);
    }
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};
