import React from 'react';
import { motion } from 'framer-motion';
import { UserX, Crown } from 'lucide-react';

interface RoomMembersProps {
  users: Array<{
    user_id: string;
    user_email: string;
  }>;
  isOwner: boolean;
  onKickUser: (userId: string) => void;
  onClose: () => void;
}

export default function RoomMembers({ users, isOwner, onKickUser, onClose }: RoomMembersProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-6 bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Room Members ({users.length})</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          Close
        </button>
      </div>
      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.user_id}
            className="flex items-center justify-between p-3 bg-gray-700/30 rounded-xl"
          >
            <div className="flex items-center gap-2">
              {isOwner && user.user_id === users[0]?.user_id && (
                <Crown className="w-5 h-5 text-yellow-500" />
              )}
              <span>{user.user_email}</span>
            </div>
            {isOwner && user.user_id !== users[0]?.user_id && (
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