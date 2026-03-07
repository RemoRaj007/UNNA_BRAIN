const BASE = import.meta.env.VITE_API_BASE_URL || ''
export const apiUrl = (path) => `${BASE}${path}`
