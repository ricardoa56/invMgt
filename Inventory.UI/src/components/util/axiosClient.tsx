import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'https://localhost:7144/api',
});

// This "interceptor" runs BEFORE every request
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default axiosClient;