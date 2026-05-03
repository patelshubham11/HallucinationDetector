
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

dotenv.config({ path: '../.env' });

const testGemini = async () => {
    console.log("Testing Gemini...");
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("Gemini Success:", result.response.text());
    } catch (error) {
        console.error("Gemini Failed:", error.message);
    }
};

const testOpenRouter = async () => {
    console.log("\nTesting OpenRouter...");
    try {
        const client = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENROUTER_API_KEY,
        });
        const response = await client.chat.completions.create({
            model: "google/gemini-2.0-flash-exp",
            messages: [{ role: "user", content: "Hello" }],
        });
        console.log("OpenRouter Success:", response.choices[0].message.content);
    } catch (error) {
        console.error("OpenRouter Failed:", error.message);
    }
};

const testSerpApi = async () => {
    console.log("\nTesting SerpApi...");
    try {
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                q: "test",
                api_key: process.env.SERPAPI_KEY,
                engine: "google"
            }
        });
        console.log("SerpApi Success:", response.data.organic_results ? "Results found" : "No results");
    } catch (error) {
        console.error("SerpApi Failed:", error.message);
    }
};

const runTests = async () => {
    await testGemini();
    await testOpenRouter();
    await testSerpApi();
};

runTests();
