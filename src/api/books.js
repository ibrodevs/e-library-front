import axios from 'axios';

// Всегда берём книги с Heroku (там данные)
const API_BASE = 'https://su-library-back-d2d8d21af2e4.herokuapp.com/api';
const API_URL = `${API_BASE}/books`;

export const getBooks = (categoryIds = []) => {
  const params = {};
  if (categoryIds.length > 0) {
    params.categories = categoryIds.join(',');
  }
  return axios.get(`${API_URL}`, { params });
};

export const getBookDetails = (id) => axios.get(`${API_URL}/${id}`);