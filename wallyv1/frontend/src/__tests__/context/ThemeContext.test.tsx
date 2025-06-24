import React from 'react';
import { render, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../context/ThemeContext.jsx';
import { expect, jest } from '@jest/globals';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Create a test component that consumes the theme context
const TestComponent = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <button data-testid="toggle" onClick={toggleTheme}>Toggle</button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    // Mock setAttribute as a jest.fn so we can assert calls
    Object.defineProperty(document.body, 'setAttribute', {
      value: jest.fn(),
      writable: true,
    });
    jest.clearAllMocks();
  });

  test('should provide light theme by default', () => {
    localStorageMock.getItem.mockReturnValueOnce(null);

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(getByTestId('theme').textContent).toBe('light');
  });

  test('should load theme from localStorage', () => {
    localStorageMock.getItem.mockReturnValueOnce('dark');

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(getByTestId('theme').textContent).toBe('dark');
  });

  test('should toggle theme', () => {
    localStorageMock.getItem.mockReturnValueOnce('light');

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Initial state
    expect(getByTestId('theme').textContent).toBe('light');

    // Toggle to dark
    act(() => {
      getByTestId('toggle').click();
    });

    expect(getByTestId('theme').textContent).toBe('dark');
    expect(document.body.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');

    // Toggle back to light
    act(() => {
      getByTestId('toggle').click();
    });

    expect(getByTestId('theme').textContent).toBe('light');
    expect(document.body.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
  });
});


