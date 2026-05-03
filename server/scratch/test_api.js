import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const test = async () => {
    try {
        console.log("Testing /api/chat/ask with model: openrouter");
        // Note: You need a valid JWT token to call this. 
        // For testing purposes, I'll try to call the generateResponse and verifyResponse directly.
        // But first let's see if I can find an existing user/token or bypass check.
    } catch (e) {
        console.error(e);
    }
};
