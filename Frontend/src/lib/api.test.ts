import { describe, it, expect } from 'vitest';
import { api } from './api';

describe('api client', () => {
  it('should have a base URL configured', () => {
    expect(api.defaults.baseURL).toBeTruthy();
  });

  it('should have JSON content type header', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });
});
