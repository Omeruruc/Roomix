import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import RoomView from '../components/RoomView';
import AdManager from '../components/AdManager';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { session } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  if (!session || !roomId) {
    return null; // This should be handled by the router, but just in case
  }

  const handleLeaveRoom = () => {
    navigate('/rooms');
  };

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
            <RoomView 
              session={session} 
              roomId={roomId}
              onLeaveRoom={handleLeaveRoom}
            />
          </main>
        </motion.div>
      </div>
    </div>
  );
} 