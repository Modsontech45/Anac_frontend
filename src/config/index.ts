export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  // Base URL without /api for static files
  get baseUrl() {
    return this.apiUrl.replace('/api', '');
  },
};

export default config;
