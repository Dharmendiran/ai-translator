import React from 'react';
import SunIcon from './SunIcon';
import MoonIcon from './MoonIcon';

interface ThemeToggleProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
    const isDark = theme === 'dark';
    return (
        <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
    );
};

export default ThemeToggle;
