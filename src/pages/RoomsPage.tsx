import React from 'react';
import { motion } from 'framer-motion';
import RoomList from '../components/RoomList';
import AdManager from '../components/AdManager';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function RoomsPage() {
  const { session } = useAuth();
  const { theme } = useTheme();

  if (!session) {
    return null; // This should be handled by the router, but just in case
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-8"
        >
          {/* Left Sidebar */}
          <aside className="hidden lg:block w-[300px] flex-shrink-0">
            <AdManager />
          </aside>

          {/* Main Content */}
          <main className={`flex-1 rounded-2xl overflow-hidden shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <RoomList 
              session={session} 
              onRoomSelect={(roomId) => {
                window.location.href = `/room/${roomId}`;
              }} 
            />
          </main>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-[300px] flex-shrink-0">
            <AdManager />
          </aside>
        </motion.div>
      </div>
    </div>
  );
} 