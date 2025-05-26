import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} style={{ float: 'right', margin: '1rem' }}>
      {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
};
