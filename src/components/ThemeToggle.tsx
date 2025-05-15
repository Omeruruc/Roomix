import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={`p-2.5 rounded-xl transition-all duration-300 relative overflow-hidden ${
        theme === 'dark' 
          ? 'bg-gray-800/80 hover:bg-gray-700/80 text-yellow-400 border border-yellow-500/20' 
          : 'bg-blue-100/80 hover:bg-blue-200/80 text-blue-800 border border-blue-300/50'
      } backdrop-blur-sm shadow-lg`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <motion.div
        initial={false}
        animate={{ 
          rotate: theme === 'dark' ? 0 : 180,
          scale: [1, 1.2, 1] 
        }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </motion.div>
      <motion.div 
        className={`absolute inset-0 opacity-20 ${theme === 'dark' ? 'bg-yellow-500' : 'bg-blue-500'}`}
        initial={false}
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.3, 0.2]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.button>
  );
}