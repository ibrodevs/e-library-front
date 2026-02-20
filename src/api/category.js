import axios from 'axios';

// Всегда берём категории с Heroku (там данные)
const API_BASE = 'https://su-library-back-d2d8d21af2e4.herokuapp.com/api';
const API_URL = `${API_BASE}/categories`;

// Debug: Log API URL
console.log('Categories API_BASE:', API_BASE);

export const getCategories = () => axios.get(API_URL);