import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAuthStore } from '@/store/authStore';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/admin/usuarios',
}));

// Import the page AFTER mocks are set up
import AdminUsuariosPage from './page';

describe('AdminUsuariosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isInitialized: false,
    });
  });

  it('should redirect non-ADMIN users to /', () => {
    // Set up a MANAGER user
    useAuthStore.setState({
      user: {
        id: 'u1',
        email: 'manager@test.com',
        firstName: 'Manager',
        lastName: 'Test',
        role: 'MANAGER',
      },
      accessToken: 'token',
      refreshToken: 'refresh',
      isAuthenticated: true,
      isInitialized: true,
    });

    render(<AdminUsuariosPage />);
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('should redirect USER to /', () => {
    useAuthStore.setState({
      user: {
        id: 'u2',
        email: 'user@test.com',
        firstName: 'User',
        lastName: 'Test',
        role: 'USER',
      },
      accessToken: 'token',
      isAuthenticated: true,
      isInitialized: true,
    });

    render(<AdminUsuariosPage />);
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('should redirect AUDITOR to /', () => {
    useAuthStore.setState({
      user: {
        id: 'u3',
        email: 'auditor@test.com',
        firstName: 'Auditor',
        lastName: 'Test',
        role: 'AUDITOR',
      },
      accessToken: 'token',
      isAuthenticated: true,
      isInitialized: true,
    });

    render(<AdminUsuariosPage />);
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('should allow ADMIN to access the page', () => {
    useAuthStore.setState({
      user: {
        id: 'u4',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'Test',
        role: 'ADMIN',
        organizationId: 'org-1',
      },
      accessToken: 'token',
      isAuthenticated: true,
      isInitialized: true,
    });

    render(<AdminUsuariosPage />);
    // Should NOT redirect
    expect(mockPush).not.toHaveBeenCalled();
    // Should render the page title
    expect(screen.getByText('Usuarios')).toBeInTheDocument();
  });
});