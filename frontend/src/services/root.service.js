import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  withCredentials: true, // Envía y recibe la cookie 'access_token' automáticamente
  headers: {
    'Content-Type': 'application/json',
  },
});

export default instance;