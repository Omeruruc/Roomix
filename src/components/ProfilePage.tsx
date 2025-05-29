import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="relative">
      <div className="fixed top-4 right-4 z-50">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSettings(false)}
          className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
        >
          <X className="w-6 h-6" />
        </motion.button>
      </div>
      <div className="space-y-6">
        {/* Rest of the component content */}
      </div>
    </div>
  );
};

export default ProfilePage; 