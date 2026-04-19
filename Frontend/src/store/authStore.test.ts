import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isInitialized: false,
    });
  });

  describe('setAuth', () => {
    it('should set user, tokens, and isAuthenticated', () => {
      const { setAuth } = useAuthStore.getState();

      setAuth(
        { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', role: 'USER' },
        'access-token',
        'refresh-token',
      );

      const state = useAuthStore.getState();
      expect(state.user?.email).toBe('test@test.com');
      expect(state.accessToken).toBe('access-token');
      expect(state.refreshToken).toBe('refresh-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isInitialized).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear all auth state', () => {
      const { setAuth, logout } = useAuthStore.getState();

      setAuth(
        { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', role: 'USER' },
        'access-token',
        'refresh-token',
      );

      logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isInitialized).toBe(true);
    });
  });

  describe('updateUser', () => {
    it('should update user data', () => {
      const { setAuth, updateUser } = useAuthStore.getState();

      setAuth(
        { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', role: 'USER' },
        'access-token',
        'refresh-token',
      );

      updateUser({ id: '1', email: 'new@test.com', firstName: 'New', lastName: 'Name', role: 'ADMIN' });

      const state = useAuthStore.getState();
      expect(state.user?.email).toBe('new@test.com');
      expect(state.user?.role).toBe('ADMIN');
    });
  });
});
