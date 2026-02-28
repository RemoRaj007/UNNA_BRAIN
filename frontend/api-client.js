/**
 * UNNA Brain API Client
 *
 * Unified API client for frontend to communicate with UNNA Brain backend.
 * Handles authentication, error handling, request/response interceptors, and base URL configuration.
 *
 * Usage:
 *   import { apiClient } from './api-client.js';
 *
 *   // GET request
 *   const data = await apiClient.get('/reports');
 *
 *   // POST request
 *   const result = await apiClient.post('/reports', {
 *     title: 'My Report',
 *     file_ids: ['file-123']
 *   });
 *
 *   // File upload
 *   const formData = new FormData();
 *   formData.append('file', fileInput.files[0]);
 *   const uploadResult = await apiClient.post('/upload', formData);
 *
 *   // With custom options
 *   const result = await apiClient.get('/reports', {
 *     params: { skip: 20, limit: 10 },
 *     timeout: 30000
 *   });
 */

class APIClient {
  /**
   * Initialize API client with configuration
   * @param {Object} config - Configuration object
   * @param {string} config.baseURL - Base URL for API (default: window.location.origin/api/v1)
   * @param {string} config.timeout - Request timeout in milliseconds (default: 30000)
   * @param {boolean} config.debug - Enable debug logging (default: false)
   */
  constructor(config = {}) {
    this.baseURL = config.baseURL || `${window.location.origin}/api/v1`;
    this.timeout = config.timeout || 30000;
    this.debug = config.debug || false;

    // Token management
    this.tokenKey = 'api_token';
    this.tokenExpiryKey = 'api_token_expiry';

    this.log('APIClient initialized', {
      baseURL: this.baseURL,
      timeout: this.timeout,
      debug: this.debug
    });
  }

  /**
   * Get stored auth token
   * @returns {string|null} Auth token or null if not found/expired
   */
  getToken() {
    const token = localStorage.getItem(this.tokenKey);
    const expiry = localStorage.getItem(this.tokenExpiryKey);

    if (!token || !expiry) {
      return null;
    }

    // Check if token has expired
    if (Date.now() > parseInt(expiry)) {
      this.clearToken();
      return null;
    }

    return token;
  }

  /**
   * Store auth token
   * @param {string} token - JWT token
   * @param {number} expiresIn - Token expiry time in seconds
   */
  setToken(token, expiresIn = 3600) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(
      this.tokenExpiryKey,
      (Date.now() + expiresIn * 1000).toString()
    );
    this.log('Token stored', { expiresIn });
  }

  /**
   * Clear stored auth token
   */
  clearToken() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.tokenExpiryKey);
    this.log('Token cleared');
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if valid token exists
   */
  isAuthenticated() {
    return this.getToken() !== null;
  }

  /**
   * Log debug messages
   * @private
   */
  log(...args) {
    if (this.debug) {
      console.log('[APIClient]', ...args);
    }
  }

  /**
   * Build fetch URL with query parameters
   * @private
   */
  buildURL(endpoint, params) {
    const url = new URL(this.baseURL + endpoint);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          url.searchParams.append(key, value);
        }
      });
    }

    return url.toString();
  }

  /**
   * Build request headers
   * @private
   */
  buildHeaders(customHeaders = {}, isFormData = false) {
    const headers = {
      ...customHeaders
    };

    // Add auth token if available
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData (browser will set it with boundary)
    if (!isFormData) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    return headers;
  }

  /**
   * Serialize body for request
   * @private
   */
  serializeBody(body) {
    if (body instanceof FormData) {
      return body;
    }

    if (body && typeof body === 'object') {
      return JSON.stringify(body);
    }

    return body;
  }

  /**
   * Create abort controller with timeout
   * @private
   */
  createAbortController(timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    return { controller, timeoutId };
  }

  /**
   * Parse response body
   * @private
   */
  async parseResponse(response) {
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    if (contentType && contentType.includes('text')) {
      return await response.text();
    }

    return await response.blob();
  }

  /**
   * Handle response errors
   * @private
   */
  async handleResponseError(response) {
    let errorData;

    try {
      errorData = await this.parseResponse(response);
    } catch {
      errorData = { detail: 'Failed to parse error response' };
    }

    const error = new Error(errorData.detail || 'API request failed');
    error.status = response.status;
    error.data = errorData;

    this.log('API Error', { status: response.status, error: errorData });

    throw error;
  }

  /**
   * Make HTTP request
   * @private
   */
  async request(method, endpoint, options = {}) {
    const {
      body,
      params,
      headers: customHeaders = {},
      timeout = this.timeout,
      responseType = 'json'
    } = options;

    const isFormData = body instanceof FormData;
    const url = this.buildURL(endpoint, params);
    const fetchHeaders = this.buildHeaders(customHeaders, isFormData);
    const serializedBody = this.serializeBody(body);

    const { controller, timeoutId } = this.createAbortController(timeout);

    const fetchOptions = {
      method,
      headers: fetchHeaders,
      signal: controller.signal
    };

    if (serializedBody) {
      fetchOptions.body = serializedBody;
    }

    try {
      this.log(`${method} ${endpoint}`, { params, headers: fetchHeaders });

      const response = await fetch(url, fetchOptions);

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleResponseError(response);
      }

      const data = await this.parseResponse(response);

      this.log(`${method} ${endpoint} - Success`, { status: response.status });

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout after ${timeout}ms`);
        timeoutError.code = 'TIMEOUT';
        this.log('Request timeout', { endpoint, timeout });
        throw timeoutError;
      }

      // Re-throw if already an API error
      if (error instanceof Error && error.status) {
        throw error;
      }

      // Network error or other fetch error
      const networkError = new Error(`Network error: ${error.message}`);
      networkError.code = 'NETWORK_ERROR';
      networkError.originalError = error;
      this.log('Network error', { endpoint, message: error.message });
      throw networkError;
    }
  }

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   */
  async get(endpoint, options = {}) {
    return this.request('GET', endpoint, options);
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object|FormData} body - Request body
   * @param {Object} options - Request options
   */
  async post(endpoint, body, options = {}) {
    return this.request('POST', endpoint, { ...options, body });
  }

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body
   * @param {Object} options - Request options
   */
  async put(endpoint, body, options = {}) {
    return this.request('PUT', endpoint, { ...options, body });
  }

  /**
   * PATCH request
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body
   * @param {Object} options - Request options
   */
  async patch(endpoint, body, options = {}) {
    return this.request('PATCH', endpoint, { ...options, body });
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   */
  async delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, options);
  }

  // ============================================================================
  // Convenience Methods for Common Operations
  // ============================================================================

  /**
   * Health check
   */
  async checkHealth() {
    return this.get('/health');
  }

  /**
   * Get authentication token
   * @param {string} username - User email or username
   * @param {string} password - User password
   */
  async authenticate(username, password) {
    const result = await this.post('/auth/token', {
      username,
      password
    });

    if (result.access_token) {
      this.setToken(result.access_token, result.expires_in);
    }

    return result;
  }

  /**
   * Upload file
   * @param {File} file - File to upload
   * @param {string} description - Optional file description
   */
  async uploadFile(file, description) {
    const formData = new FormData();
    formData.append('file', file);

    if (description) {
      formData.append('description', description);
    }

    return this.post('/upload', formData);
  }

  /**
   * List reports
   * @param {Object} options - Query options (skip, limit, status)
   */
  async getReports(options = {}) {
    return this.get('/reports', { params: options });
  }

  /**
   * Get report details
   * @param {string} reportId - Report ID
   */
  async getReport(reportId) {
    return this.get(`/reports/${reportId}`);
  }

  /**
   * Create report
   * @param {Object} reportData - Report data
   */
  async createReport(reportData) {
    return this.post('/reports', reportData);
  }

  /**
   * Update report
   * @param {string} reportId - Report ID
   * @param {Object} reportData - Updated report data
   */
  async updateReport(reportId, reportData) {
    return this.patch(`/reports/${reportId}`, reportData);
  }

  /**
   * Delete report
   * @param {string} reportId - Report ID
   */
  async deleteReport(reportId) {
    return this.delete(`/reports/${reportId}`);
  }

  /**
   * Get dashboard data
   * @param {Object} options - Query options (period, report_id)
   */
  async getDashboard(options = {}) {
    return this.get('/dashboard', { params: options });
  }

  /**
   * Get admin status
   */
  async getAdminStatus() {
    return this.get('/admin/status');
  }

  /**
   * Get users list (admin only)
   * @param {Object} options - Query options (skip, limit)
   */
  async getUsers(options = {}) {
    return this.get('/admin/users', { params: options });
  }

  /**
   * Logout - clears stored token
   */
  logout() {
    this.clearToken();
    this.log('Logged out');
  }
}

// Create default instance
const apiClient = new APIClient({
  debug: false
});

// Export both class and instance
export { APIClient, apiClient };

// For CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APIClient, apiClient };
}
