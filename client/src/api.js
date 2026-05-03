import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    return res.data;
};

export const signup = async (email, password) => {
    const res = await axios.post(`${API_URL}/auth/signup`, { email, password });
    return res.data;
};

export const askAi = async (prompt, model, historyContext = []) => {
    const res = await axios.post(`${API_URL}/chat/ask`, { prompt, model, historyContext }, { headers: getAuthHeader() });
    return res.data;
};

export const getHistory = async () => {
    const res = await axios.get(`${API_URL}/chat/history`, { headers: getAuthHeader() });
    return res.data;
};
