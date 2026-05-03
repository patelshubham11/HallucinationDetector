import Chat from '../models/Chat.js';
import { generateResponse } from '../services/aiService.js';
import { verifyResponse } from '../services/hallucinationDetector.js';

export const askAi = async (req, res) => {
  try {
    const { prompt, model, historyContext = [] } = req.body;
    const userId = req.user._id;

    console.log(`[ChatController] Request received: User=${userId}, Model=${model}, PromptLength=${prompt?.length}`);

    if (!prompt || !model) {
      return res.status(400).json({ message: "Prompt and model are required." });
    }

    // 1. Generate AI Response with full conversation history
    console.log(`[ChatController] Calling AI service for model: ${model}`);
    const aiText = await generateResponse(prompt, model, historyContext);
    console.log(`[ChatController] AI response generated successfully.`);

    // 2. Verify for Hallucinations
    console.log(`[ChatController] Running hallucination verification...`);
    const verificationResults = await verifyResponse(prompt, aiText);
    console.log(`[ChatController] Verification complete. Confidence: ${verificationResults.overallConfidence}`);

    // 3. Save to database
    const newChat = await Chat.create({
      userId,
      prompt,
      modelUsed: model,
      response: aiText,
      overallConfidence: verificationResults.overallConfidence,
      claims: verificationResults.claims
    });

    res.status(201).json(newChat);

  } catch (error) {
    console.error("--- CHAT ERROR REPORT ---");
    console.error("Path: /api/chat/ask");
    console.error("Prompt:", req.body.prompt);
    console.error("Model:", req.body.model);
    console.error("Error Message:", error.message);
    console.error("Stack Trace:", error.stack);
    console.error("-------------------------");
    res.status(500).json({ message: "Error generating response", error: error.message });
  }
};

export const getHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const chats = await Chat.find({ userId }).sort({ createdAt: -1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching history", error: error.message });
  }
};
