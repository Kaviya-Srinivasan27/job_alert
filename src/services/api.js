import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Unga Node.js backend URL inga varum
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;