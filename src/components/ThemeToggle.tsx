import { Button } from '@heroui/react';
import { useTheme } from '@/context/ThemeContext';
import { MoonIcon, SunIcon } from './icons';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Button
      isIconOnly
      variant="light"
      radius="full"
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      onPress={toggleTheme}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
