import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService, documentsService, environmentalService } from './services';
import { api } from './api';

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('login', () => {
    it('should call POST /auth/login', async () => {
      (api.post as any).mockResolvedValue({ data: { user: {}, accessToken: 'a', refreshToken: 'r' } });

      await authService.login({ email: 'test@test.com', password: 'password' });

      expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'test@test.com', password: 'password' });
    });
  });

  describe('register', () => {
    it('should call POST /auth/register', async () => {
      (api.post as any).mockResolvedValue({ data: { user: {}, accessToken: 'a', refreshToken: 'r' } });

      await authService.register({ email: 'test@test.com', password: 'password', firstName: 'T', lastName: 'U' });

      expect(api.post).toHaveBeenCalledWith('/auth/register', expect.objectContaining({ email: 'test@test.com' }));
    });
  });
});

describe('documentsService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAll should call GET /documents', async () => {
    (api.get as any).mockResolvedValue({ data: [] });
    await documentsService.getAll();
    expect(api.get).toHaveBeenCalledWith('/documents');
  });

  it('create should call POST /documents', async () => {
    (api.post as any).mockResolvedValue({ data: {} });
    await documentsService.create({ title: 'Test' });
    expect(api.post).toHaveBeenCalledWith('/documents', { title: 'Test' });
  });

  it('delete should call DELETE /documents/:id', async () => {
    (api.delete as any).mockResolvedValue({ data: {} });
    await documentsService.delete('123');
    expect(api.delete).toHaveBeenCalledWith('/documents/123');
  });
});

describe('environmentalService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAspects should call GET /environmental/aspects', async () => {
    (api.get as any).mockResolvedValue({ data: [] });
    await environmentalService.getAspects();
    expect(api.get).toHaveBeenCalledWith('/environmental/aspects');
  });

  it('createAspect should call POST /environmental/aspects', async () => {
    (api.post as any).mockResolvedValue({ data: {} });
    await environmentalService.createAspect({ name: 'Test' });
    expect(api.post).toHaveBeenCalledWith('/environmental/aspects', { name: 'Test' });
  });
});
