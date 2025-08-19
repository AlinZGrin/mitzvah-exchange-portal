const { test, expect } = require('@playwright/test');
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

test.describe('API Integration Tests', () => {
  let authToken = null;

  test.beforeAll(async () => {
    // Login and get auth token
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email: 'admin@mitzvahexchange.com',
        password: 'admin123'
      });
      authToken = response.data.token;
      console.log('Auth token obtained:', authToken ? 'Success' : 'Failed');
    } catch (error) {
      console.error('Failed to obtain auth token:', error.message);
    }
  });

  test('should handle login API correctly', async () => {
    // Test successful login
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@mitzvahexchange.com',
      password: 'admin123'
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('token');
    expect(response.data).toHaveProperty('user');
    expect(response.data.user.email).toBe('admin@mitzvahexchange.com');
  });

  test('should reject invalid login credentials', async () => {
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error.response.status).toBe(401);
      expect(error.response.data).toHaveProperty('error');
    }
  });

  test('should get user profile with valid token', async () => {
    if (!authToken) {
      test.skip('No auth token available');
      return;
    }

    const response = await axios.get(`${API_BASE}/users/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('user');
    expect(response.data).toHaveProperty('stats');
  });

  test('should create mitzvah request via API', async () => {
    if (!authToken) {
      test.skip('No auth token available');
      return;
    }

    const requestData = {
      title: 'API Integration Test Request',
      description: 'This request was created via API integration test',
      category: 'ERRANDS',
      urgency: 'NORMAL',
      locationDisplay: 'API Test City',
      requirements: ['Test requirement'],
      attachments: []
    };

    const response = await axios.post(`${API_BASE}/requests`, requestData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('request');
    expect(response.data.request.title).toBe(requestData.title);
  });

  test('should get requests list', async () => {
    const response = await axios.get(`${API_BASE}/requests`);
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('requests');
    expect(Array.isArray(response.data.requests)).toBe(true);
  });

  test('should handle database connection resilience', async () => {
    // Test multiple rapid requests to check for prepared statement errors
    const promises = [];
    
    for (let i = 0; i < 5; i++) {
      promises.push(
        axios.post(`${API_BASE}/auth/login`, {
          email: 'admin@mitzvahexchange.com',
          password: 'admin123'
        })
      );
    }

    const responses = await Promise.all(promises);
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('token');
    });
  });

  test('should handle concurrent request creation', async () => {
    if (!authToken) {
      test.skip('No auth token available');
      return;
    }

    const promises = [];
    
    for (let i = 0; i < 3; i++) {
      const requestData = {
        title: `Concurrent Test Request ${i}`,
        description: `Concurrent test description ${i}`,
        category: 'ERRANDS',
        urgency: 'NORMAL',
        locationDisplay: 'Concurrent Test City',
        requirements: [],
        attachments: []
      };

      promises.push(
        axios.post(`${API_BASE}/requests`, requestData, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        })
      );
    }

    const responses = await Promise.all(promises);
    
    // All requests should succeed
    responses.forEach((response, index) => {
      expect(response.status).toBe(201);
      expect(response.data.request.title).toContain(`Concurrent Test Request ${index}`);
    });
  });
});
