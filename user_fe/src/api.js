const API_BASE_URL = import.meta.env.VITE_NODE_ENV === 'production'
  ? 'https://bbn-web-production.up.railway.app/api' 
  : import.meta.env.VITE_NODE_ENV === 'development'
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:5000/api';

export default API_BASE_URL;