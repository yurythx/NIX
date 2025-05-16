require('@testing-library/jest-dom');

// Mock para o next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
}));

// Mock para o next/link
jest.mock('next/link', () => {
  return function NextLink({ children, href }) {
    return (
      <a href={href} onClick={jest.fn()}>
        {children}
      </a>
    );
  };
});

// Mock para o next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    return <img {...props} />;
  },
}));
