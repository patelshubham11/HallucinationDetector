import axios from 'axios';
import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

let openai;
let gemini;

export const initHallucinationDetector = () => {
    if (process.env.OPENAI_API_KEY) {
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    if (process.env.GEMINI_API_KEY) {
        gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
};

// Intelligent sentence splitter (LLM based)
const extractClaims = async (text) => {
    if (gemini && process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('YOUR_')) {
        try {
            const genModel = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `Extract exactly the 3 most important factual claims from the following text into a JSON array of clean, simple English sentences. Return ONLY a valid JSON array of strings, nothing else.\n\nText: ${text}`;
            const response = await genModel.generateContent(prompt);
            let rawResponse = response.response.text();
            const jsonMatch = rawResponse.match(/\[.*\]/s);
            if (jsonMatch) rawResponse = jsonMatch[0];
            const parsed = JSON.parse(rawResponse);
            if (Array.isArray(parsed)) return parsed.slice(0, 3);
        } catch (e) {
            console.warn("Gemini Claim Extraction failed:", e.message);
        }
    }

    if (process.env.OPENROUTER_API_KEY) {
        try {
            const orClient = new OpenAI({
                baseURL: "https://openrouter.ai/api/v1",
                apiKey: process.env.OPENROUTER_API_KEY,
            });
            const orResponse = await orClient.chat.completions.create({
                model: "google/gemini-2.0-flash-001",
                messages: [{ role: "user", content: `Extract exactly the 3 most important factual claims from the following text into a JSON array of clean English sentences. Return ONLY a valid JSON array of strings.\n\nText: ${text}` }]
            });
            const rawResponse = orResponse.choices[0].message.content;
            const jsonMatch = rawResponse.match(/\[.*\]/s);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (Array.isArray(parsed)) return parsed.slice(0, 3);
            }
        } catch (orError) {
            console.error("OpenRouter Claim Extraction fallback failed:", orError.message);
        }
    }

    const rawClaims = text.match(/[^.!?]+[.!?]+/g) || [text];
    return rawClaims.slice(0, 3).map(c => c.trim()).filter(c => c.length > 10);
};

// Calculate cosine similarity
const cosineSimilarity = (vecA, vecB) => {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0.0, normA = 0.0, normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

const getEmbedding = async (text) => {
    if (gemini && process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('YOUR_')) {
        try {
            const embeddingModel = gemini.getGenerativeModel({ model: "text-embedding-004" });
            const response = await embeddingModel.embedContent(text);
            return response.embedding.values;
        } catch (e) {
            console.warn("Gemini Embedding failed:", e.message);
        }
    }
    return null;
};

// Google Search via SerpAPI
const fetchSearchSnippets = async (query) => {
    try {
        if (!process.env.SERPAPI_KEY) {
            console.warn("SERPAPI_KEY not configured.");
            return [];
        }
        const response = await axios.get('https://serpapi.com/search.json', {
            params: { q: query, api_key: process.env.SERPAPI_KEY, engine: "google" }
        });
        if (response.data && response.data.organic_results) {
            return response.data.organic_results.slice(0, 2).map(res => ({
                title: res.title,
                link: res.link,
                snippet: res.snippet || ""
            }));
        }
    } catch (e) {
        console.error("Search API failed:", e.message);
    }
    return [];
};

// LLM fact-check: with snippets OR via its own knowledge
const crossCheckWithLLM = async (claim, snippets = []) => {
    let prompt;
    if (snippets.length > 0) {
        const combinedSnippets = snippets.map(s => `Title: ${s.title}\nSnippet: ${s.snippet}`).join('\n---\n');
        prompt = `You are a fact-checker.\nClaim: "${claim}"\nSearch Results:\n${combinedSnippets}\n\nDoes the evidence support the claim?\nReturn ONLY a single integer: 100 (strongly supported), 75 (somewhat), 50 (neutral), or 0 (contradicted).`;
    } else {
        prompt = `You are a fact-checker with broad world knowledge.\nIs the following claim factually correct?\nClaim: "${claim}"\nReturn ONLY a single integer:\n100 = clearly true\n75 = mostly true\n50 = uncertain\n0 = clearly false`;
    }

    // Try Gemini independently
    if (gemini && process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('YOUR_')) {
        try {
            const genModel = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
            const response = await genModel.generateContent(prompt);
            const text = response.response.text().trim();
            console.log(`[LLM-Gemini] "${claim.slice(0, 40)}" => "${text}"`);
            const match = text.match(/\d+/);
            if (match) return Math.min(100, parseInt(match[0]));
        } catch (e) {
            console.error("[LLM-Gemini] Failed:", e.message);
        }
    }

    // Try OpenRouter independently
    if (process.env.OPENROUTER_API_KEY) {
        try {
            const orClient = new OpenAI({
                baseURL: "https://openrouter.ai/api/v1",
                apiKey: process.env.OPENROUTER_API_KEY,
            });
            const orResponse = await orClient.chat.completions.create({
                model: "google/gemini-2.0-flash-001",
                messages: [{ role: "user", content: prompt }]
            });
            const text = orResponse.choices[0].message.content.trim();
            console.log(`[LLM-OpenRouter] "${claim.slice(0, 40)}" => "${text}"`);
            const match = text.match(/\d+/);
            if (match) return Math.min(100, parseInt(match[0]));
        } catch (e) {
            console.error("[LLM-OpenRouter] Failed:", e.message);
        }
    }

    console.warn(`[LLM-Check] Both providers failed for: "${claim.slice(0, 40)}". Returning 50.`);
    return 50;
};

export const verifyResponse = async (originalPrompt, aiResponse) => {
    try {
        const claims = await extractClaims(aiResponse);
        if (!claims || claims.length === 0) return { overallConfidence: 100, claims: [] };

        const verifiedClaims = [];

        for (const claim of claims) {
            try {
                const snippets = await fetchSearchSnippets(claim);

                if (!snippets || snippets.length === 0) {
                    // No search results — ask LLM purely from knowledge
                    console.log(`No search results for: "${claim}". Using LLM knowledge check...`);
                    const llmOnlyScore = await crossCheckWithLLM(claim);
                    verifiedClaims.push({
                        text: claim,
                        isFact: llmOnlyScore >= 70,
                        confidence: llmOnlyScore,
                        sources: [],
                        status: "Verified via AI knowledge (no web sources)"
                    });
                    continue;
                }

                let maxSim = 0;
                const claimEmbedding = await getEmbedding(claim);

                if (claimEmbedding) {
                    const validSnippets = snippets.filter(s => s && s.snippet && s.snippet.length > 5);
                    for (const snip of validSnippets) {
                        const snippetEmbedding = await getEmbedding(snip.snippet);
                        if (snippetEmbedding) {
                            const sim = cosineSimilarity(claimEmbedding, snippetEmbedding);
                            if (sim > maxSim) maxSim = sim;
                        }
                    }
                } else {
                    console.warn("Using text-based similarity fallback for:", claim);
                    for (const snip of snippets) {
                        const snipText = snip.snippet.toLowerCase();
                        const claimText = claim.toLowerCase();
                        if (snipText.includes(claimText) || claimText.includes(snipText)) maxSim = 0.9;
                        else maxSim = 0.6;
                    }
                }

                let confidenceScore = Math.max(0, Math.min(100, Math.round(maxSim * 100)));

                // Second opinion if similarity is mediocre
                if (confidenceScore >= 40 && confidenceScore < 75) {
                    console.log(`Mediocre similarity (${confidenceScore}%) for: "${claim}". Asking second opinion...`);
                    const secondOpinionScore = await crossCheckWithLLM(claim, snippets);
                    if (secondOpinionScore > confidenceScore) {
                        console.log(`Boosted from ${confidenceScore}% to ${secondOpinionScore}%.`);
                        confidenceScore = secondOpinionScore;
                    }
                }

                const isFact = confidenceScore >= 70;

                verifiedClaims.push({ text: claim, isFact, confidence: confidenceScore, sources: snippets });
                await new Promise(r => setTimeout(r, 600));

            } catch (error) {
                console.error("Claim processing error:", error.message);
                verifiedClaims.push({ text: claim, isFact: false, confidence: 0, sources: [] });
            }
        }

        const totalConfidence = verifiedClaims.reduce((acc, curr) => acc + curr.confidence, 0);
        const overallConfidence = verifiedClaims.length > 0 ? Math.round(totalConfidence / verifiedClaims.length) : 0;

        return { overallConfidence, claims: verifiedClaims };
    } catch (error) {
        console.error("Verification system failure:", error);
        return { overallConfidence: 0, claims: [], error: error.message };
    }
};
