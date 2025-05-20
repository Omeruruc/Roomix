import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ProfileModalProps {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const { theme } = useTheme();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto relative`}
      >
        <button
          onClick={onClose}
          className={`absolute top-2 right-2 p-2 rounded-lg ${
            theme === 'dark'
              ? 'hover:bg-gray-700'
              : 'hover:bg-gray-100'
          } transition-colors z-10`}
        >
          <X className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
} 