const API_BASE_URL =
  import.meta.env.VITE_NODE_ENV === 'development'
    ? import.meta.env.VITE_API_URL
    : 'https://bbn-web-production.up.railway.app/api';

export default API_BASE_URL;
