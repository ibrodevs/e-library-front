import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API_URL = `${API_BASE}/books`;

export const getBooks = (categoryIds = []) => {
  const params = {};
  if (categoryIds.length > 0) {
    params.categories = categoryIds.join(',');
  }
  return axios.get(`${API_URL}`, { params });
};

export const getBookDetails = (id) => axios.get(`${API_URL}/${id}`);
