import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const themes = {
  dark: {
    background: 'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900',
    text: 'text-white',
    card: 'bg-white/5 border-white/10',
    input: 'bg-white/10 border-white/20 text-white placeholder:text-gray-400',
    button: {
      primary: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700',
      secondary: 'border-white/20 text-white hover:bg-white/10'
    }
  },
  light: {
    background: 'bg-gradient-to-br from-purple-100 via-purple-200 to-purple-100',
    text: 'text-gray-900',
    card: 'bg-white/80 border-purple-200',
    input: 'bg-white/80 border-purple-200 text-gray-900 placeholder:text-gray-500',
    button: {
      primary: 'bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500',
      secondary: 'border-purple-200 text-gray-900 hover:bg-purple-100'
    }
  }
};
