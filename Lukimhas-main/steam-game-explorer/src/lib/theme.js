// src/lib/theme.js
export const themes = {
  dark: {
    background: {
      primary: 'bg-gray-950',
      // Adicionando múltiplas camadas de gradiente para criar o efeito de transição
      gradient: 'bg-gradient-to-br from-purple-900/40 via-gray-950 to-gray-950 bg-blend-overlay',
    },
    text: {
      primary: 'text-gray-100',
      secondary: 'text-gray-300',
      muted: 'text-gray-400',
      accent: 'text-purple-400',
    },
    card: {
      background: 'bg-gray-950/80 backdrop-blur-sm',
      border: 'border border-purple-900/30',
      hover: 'hover:bg-gray-950/90',
    },
    input: {
      background: 'bg-gray-950/80',
      border: 'border border-purple-800/50',
      placeholder: 'placeholder:text-gray-500',
      text: 'text-gray-100',
      focus: 'focus:border-purple-500 focus:ring-purple-500/20',
    },
    button: {
      primary: 'bg-gradient-to-r from-purple-600 to-purple-900 hover:from-purple-700 hover:to-purple-950 text-white',
      secondary: 'bg-gray-950/80 hover:bg-gray-900 text-gray-100 border border-purple-900/30',
    },
    gameSpecs: {
      background: 'bg-gray-950/50',
      border: 'border-purple-500/20',
      text: {
        primary: 'text-white',
        secondary: 'text-gray-400',
      },
    },
  },
  light: {
    background: {
      primary: 'bg-purple-50',
      gradient: 'bg-gradient-to-br from-[#EEAECA]/90 to-[#94BBE9]/90',
    },
    text: {
      primary: 'text-gray-900',     // Texto principal escuro
      secondary: 'text-gray-700',   // Texto secundário
      muted: 'text-gray-600',       // Texto desenfatizado
      accent: 'text-purple-600',    // Texto de destaque
    },
    card: {
      background: 'bg-white/80 backdrop-blur-sm',
      border: 'border border-purple-100',
      hover: 'hover:bg-white/90',
    },
    input: {
      background: 'bg-white/90',
      border: 'border border-purple-200',
      placeholder: 'placeholder:text-gray-400',
      text: 'text-gray-900',
      focus: 'focus:border-purple-400 focus:ring-purple-300/20',
    },
    button: {
      primary: 'bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white',
      secondary: 'bg-white hover:bg-gray-50 text-gray-900 border border-purple-200',
    },
    gameSpecs: {
      background: 'bg-white/80',
      border: 'border-purple-200',
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
      },
    },
  },
};