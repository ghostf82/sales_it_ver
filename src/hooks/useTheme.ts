import { useEffect, useState } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check for stored theme preference
    const storedTheme = localStorage.getItem('bolt-ui-theme');
    
    // Default to light mode if no stored preference
    if (!storedTheme) {
      setTheme('light');
      localStorage.setItem('bolt-ui-theme', 'light');
    } else {
      setTheme(storedTheme as 'light' | 'dark');
    }

    // Apply theme class
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('bolt-ui-theme', newTheme);
  };

  return { theme, toggleTheme };
}