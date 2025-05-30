// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Next.js globals for API route testing
import 'whatwg-fetch';

Object.assign(global, {
  Request: global.Request || class MockRequest {
    constructor(input, init) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers);
      this._body = init?.body;
    }
    
    async json() {
      return this._body ? JSON.parse(this._body) : {};
    }
    
    async text() {
      return this._body || '';
    }
  },
  
  Response: global.Response || class MockResponse {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status || 200;
      this.statusText = init?.statusText || 'OK';
      this.headers = new Headers(init?.headers);
    }
    
    static json(data, init) {
      return new MockResponse(JSON.stringify(data), {
        status: init?.status || 200,
        statusText: init?.statusText || 'OK',
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers
        }
      });
    }
    
    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }
    
    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
    }
  },
  
  Headers: global.Headers || class MockHeaders {
    constructor(init) {
      this._headers = new Map();
      if (init) {
        if (init instanceof Headers) {
          init.forEach((value, key) => this._headers.set(key, value));
        } else if (Array.isArray(init)) {
          init.forEach(([key, value]) => this._headers.set(key, value));
        } else {
          Object.entries(init).forEach(([key, value]) => this._headers.set(key, value));
        }
      }
    }
    
    get(name) {
      return this._headers.get(name.toLowerCase());
    }
    
    set(name, value) {
      this._headers.set(name.toLowerCase(), value);
    }
    
    forEach(callback) {
      this._headers.forEach(callback);
    }
  }
});
