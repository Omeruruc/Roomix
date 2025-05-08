import React from 'react';
import { motion } from 'framer-motion';
import { UserX, Crown, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface RoomMembersProps {
  users: Array<{
    user_id: string;
    user_email: string;
    avatar_url: string | null;
  }>;
  isOwner: boolean;
  onKickUser: (userId: string) => void;
  onClose: () => void;
}

export default function RoomMembers({ users, isOwner, onKickUser, onClose }: RoomMembersProps) {
  const ownerUser = users[0]; // First user is always the owner
  const { theme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-6 bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Oda Üyeleri ({users.length})</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          Kapat
        </button>
      </div>
      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.user_id}
            className="flex items-center justify-between p-3 bg-gray-700/30 rounded-xl"
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              {user.avatar_url ? (
                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-600">
                  <img
                    src={user.avatar_url}
                    alt={user.user_email}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                } border border-gray-600`}>
                  <User className="w-5 h-5 text-gray-400" />
                </div>
              )}
              
              <div className="flex items-center gap-2">
                {user.user_id === ownerUser?.user_id && (
                  <Crown className="w-5 h-5 text-yellow-500" />
                )}
                <span>{user.user_email}</span>
              </div>
            </div>
            {isOwner && user.user_id !== ownerUser?.user_id && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onKickUser(user.user_id)}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200"
              >
                <UserX className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}