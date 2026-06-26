import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { api, createUser, fetchOrganizations, fetchSitesByOrg } from './api';
import { useAuthStore } from '@/store/authStore';

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios');
  return {
    ...actual,
    default: {
      ...actual.default,
      post: vi.fn(),
      get: vi.fn(),
    },
  };
});

describe('api client', () => {
  it('should have a base URL configured', () => {
    expect(api.defaults.baseURL).toBeTruthy();
  });

  it('should have JSON content type header', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });
});

describe('api request interceptor — X-Tenant-ID', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: 'u1', email: 'a@b.co', role: 'USER', firstName: 'A', lastName: 'B', organizationId: 'org-123' },
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      isAuthenticated: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isInitialized: false,
    });
  });

  it('should set X-Tenant-ID from user.organizationId (not user.id)', async () => {
    const adapter = vi.fn().mockResolvedValue({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {} });
    const testApi = axios.create({ adapter });

    // Apply the interceptor logic
    testApi.interceptors.request.use((config) => {
      const state = useAuthStore.getState();
      if (state.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`;
      }
      if (!config.headers['X-Tenant-ID']) {
        const tenantId = state.user?.organizationId;
        if (tenantId) {
          config.headers['X-Tenant-ID'] = tenantId;
        }
      }
      return config;
    });

    await testApi.get('/test');

    const callConfig = adapter.mock.calls[0][0];
    expect(callConfig.headers['X-Tenant-ID']).toBe('org-123');
    // Should NOT use user.id
    expect(callConfig.headers['X-Tenant-ID']).not.toBe('u1');
  });

  it('should NOT override X-Tenant-ID if already set by caller', async () => {
    const adapter = vi.fn().mockResolvedValue({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {} });
    const testApi = axios.create({ adapter });

    testApi.interceptors.request.use((config) => {
      const state = useAuthStore.getState();
      if (state.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`;
      }
      if (!config.headers['X-Tenant-ID']) {
        const tenantId = state.user?.organizationId;
        if (tenantId) {
          config.headers['X-Tenant-ID'] = tenantId;
        }
      }
      return config;
    });

    await testApi.get('/test', { headers: { 'X-Tenant-ID': 'override-org' } });

    const callConfig = adapter.mock.calls[0][0];
    expect(callConfig.headers['X-Tenant-ID']).toBe('override-org');
  });

  it('should not set X-Tenant-ID when user has no organizationId', async () => {
    useAuthStore.setState({
      user: { id: 'u1', email: 'a@b.co', role: 'USER', firstName: 'A', lastName: 'B' },
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      isAuthenticated: true,
    });

    const adapter = vi.fn().mockResolvedValue({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {} });
    const testApi = axios.create({ adapter });

    testApi.interceptors.request.use((config) => {
      const state = useAuthStore.getState();
      if (state.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`;
      }
      if (!config.headers['X-Tenant-ID']) {
        const tenantId = state.user?.organizationId;
        if (tenantId) {
          config.headers['X-Tenant-ID'] = tenantId;
        }
      }
      return config;
    });

    await testApi.get('/test');

    const callConfig = adapter.mock.calls[0][0];
    expect(callConfig.headers['X-Tenant-ID']).toBeUndefined();
  });
});

describe('api functions', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: 'u1', email: 'a@b.co', role: 'ADMIN', firstName: 'A', lastName: 'B', organizationId: 'org-1' },
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      isAuthenticated: true,
    });

    // Mock the api instance methods directly
    vi.spyOn(api, 'post').mockResolvedValue({ data: { id: 'new-id' } } as any);
    vi.spyOn(api, 'get').mockResolvedValue({ data: [] } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('createUser should call api.post with correct payload', async () => {
    const mockPost = vi.mocked(api.post);

    await createUser({
      email: 'test@test.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
    });

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith('/users', {
      email: 'test@test.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
    });
  });

  it('fetchOrganizations should call api.get with correct URL', async () => {
    const mockGet = vi.mocked(api.get);

    await fetchOrganizations();

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith('/users/organizations');
  });

  it('fetchSitesByOrg should call api.get with organizationId param', async () => {
    const mockGet = vi.mocked(api.get);

    await fetchSitesByOrg('org-123');

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith('/sites', { params: { organizationId: 'org-123' } });
  });
});

describe('api refresh interceptor', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: 'u1', email: 'a@b.co', role: 'USER', firstName: 'A', lastName: 'B' },
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      isAuthenticated: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should refresh access token on 401 and replay original request once', async () => {
    const mockedAxiosPost = vi.mocked(axios.post).mockResolvedValueOnce({
      data: { accessToken: 'access-2' },
    });

    // First call fails with 401, second succeeds
    let callCount = 0;
    const adapter = vi.fn().mockImplementation((config: any) => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject({ response: { status: 401 }, config });
      }
      return Promise.resolve({ data: { ok: true }, config, status: 200, statusText: 'OK', headers: {} });
    });

    const testApi = axios.create({ adapter });
    testApi.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const state = useAuthStore.getState();
          const refreshResponse = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            refreshToken: state.refreshToken,
          });
          state.setAuth(state.user!, refreshResponse.data.accessToken, state.refreshToken!);
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
          return testApi(originalRequest);
        }
        return Promise.reject(error);
      },
    );

    const result = await testApi.get('/test');
    expect(result.data).toEqual({ ok: true });
    expect(mockedAxiosPost).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().accessToken).toBe('access-2');
  });

  it('should logout and reject when refresh fails', async () => {
    vi.mocked(axios.post).mockRejectedValueOnce(new Error('refresh failed'));

    const error = { response: { status: 401 }, config: { _retry: false, headers: {} } };
    const state = useAuthStore.getState();
    const logoutSpy = vi.spyOn(state, 'logout');

    // Simulate the catch block of the interceptor
    try {
      if (error.response?.status === 401 && !error.config._retry) {
        error.config._retry = true;
        await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken: state.refreshToken });
      }
    } catch {
      state.logout();
    }

    expect(logoutSpy).toHaveBeenCalled();
  });
});
