// HeroUI Tailwind v4 plugin entry. Referenced from src/styles/globals.css via
// `@plugin "../../hero.ts"`. HeroUI 2.8.x requires Tailwind CSS v4.
import { heroui } from '@heroui/react';

// Vivid mint-green accent (#42d392 / rgb(66,211,146)) shared by buttons, chips
// and accents in both themes. Dark is the primary look.
const primary = {
  50: '#e7faf0',
  100: '#c6f0d9',
  200: '#94e3b8',
  300: '#5ed094',
  400: '#36b878',
  500: '#229c63',
  600: '#188150',
  700: '#156843',
  800: '#135237',
  900: '#10402c',
  DEFAULT: '#156843',
  foreground: '#ffffff',
};

export default heroui({
  // Global corner radii. Drives every `radius="sm|md|lg"` prop and the
  // `rounded-small/medium/large` utilities across the app. Slightly sharper
  // than HeroUI's defaults (8/12/14) for a cleaner, more modern look.
  layout: {
    radius: {
      small: '5px',
      medium: '5px',
      large: '5px',
    },
  },
  themes: {
    light: {
      colors: {
        primary,
      },
    },
    dark: {
      colors: {
        // Deep navy / near-black surfaces with the same vivid accent.
        background: '#0a0c14',
        content1: '#12141f',
        content2: '#1a1d2b',
        primary,
      },
    },
  },
});
