import React from 'react';
import { render, screen } from '@testing-library/react';
import PermissionGuard from '../PermissionGuard';
import '@testing-library/jest-dom';
import { useAuth } from '../../../contexts/AuthContext';

// Mock do hook useAuth
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock do useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

describe('PermissionGuard', () => {
  const mockAuthUser = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    is_active: true,
    is_staff: false
  };

  const mockAdminUser = {
    ...mockAuthUser,
    is_staff: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when user is authenticated and permission is "authenticated"', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: mockAuthUser,
      isLoading: false
    });

    render(
      <PermissionGuard requiredPermission="authenticated">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('renders fallback when user is not authenticated and permission is "authenticated"', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false
    });

    render(
      <PermissionGuard 
        requiredPermission="authenticated"
        fallback={<div data-testid="fallback-content">Access Denied</div>}
      >
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders children when user is admin and permission is "admin"', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: mockAdminUser,
      isLoading: false
    });

    render(
      <PermissionGuard requiredPermission="admin">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('renders fallback when user is not admin and permission is "admin"', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: mockAuthUser,
      isLoading: false
    });

    render(
      <PermissionGuard 
        requiredPermission="admin"
        fallback={<div data-testid="fallback-content">Access Denied</div>}
      >
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders children when user is the resource owner and permission is "author"', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: mockAuthUser,
      isLoading: false
    });

    render(
      <PermissionGuard 
        requiredPermission="author"
        resourceOwnerId="1"
      >
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('renders fallback when user is not the resource owner and permission is "author"', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: mockAuthUser,
      isLoading: false
    });

    render(
      <PermissionGuard 
        requiredPermission="author"
        resourceOwnerId="2"
        fallback={<div data-testid="fallback-content">Access Denied</div>}
      >
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders children when user is admin and permission is "author" regardless of resource owner', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: mockAdminUser,
      isLoading: false
    });

    render(
      <PermissionGuard 
        requiredPermission="author"
        resourceOwnerId="2" // Different from user ID
      >
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('renders nothing while loading', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: true
    });

    const { container } = render(
      <PermissionGuard requiredPermission="authenticated">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );

    expect(container).toBeEmptyDOMElement();
  });
});
