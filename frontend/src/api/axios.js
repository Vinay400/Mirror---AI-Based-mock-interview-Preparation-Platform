import axios from 'axios';
import {getToken} from '../utils/auth.js'
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});
    console.log(import.meta.env.VITE_API_URL);
api.interceptors.request.use((config) => {
    const token = getToken();

    if(token) {
    config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;