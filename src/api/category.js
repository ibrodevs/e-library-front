import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API_URL = `${API_BASE}/categories`;

export const getCategories = () => axios.get(API_URL);
