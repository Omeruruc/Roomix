import React from 'react';
import { motion } from 'framer-motion';
import { UserX, Crown, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

interface RoomMembersProps {
  users: Array<{
    user_id: string;
    user_email: string;
    avatar_url: string | null;
    first_name: string | null;
    last_name: string | null;
  }>;
  isOwner: boolean;
  onKickUser: (userId: string) => void;
  onClose: () => void;
}

export default function RoomMembers({ users, isOwner, onKickUser, onClose }: RoomMembersProps) {
  const navigate = useNavigate();
  const ownerUser = users[0]; // First user is always the owner
  const { theme } = useTheme();

  // Kullanıcı için gösterilecek adı oluşturan yardımcı fonksiyon
  const getUserDisplayName = (user: RoomMembersProps['users'][0]) => {
    // İsim ve soyisim varsa tam adı göster
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    // Sadece isim varsa
    if (user.first_name) {
      return user.first_name;
    }
    // Sadece soyisim varsa
    if (user.last_name) {
      return user.last_name;
    }
    // Hiçbiri yoksa e-posta adresini göster
    return user.user_email;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`mb-6 ${
        theme === 'dark' 
          ? 'bg-gray-800/50 border-gray-700/50' 
          : 'bg-white/80 border-gray-200'
      } backdrop-blur-sm p-6 rounded-2xl border`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl font-semibold ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Oda Üyeleri ({users.length})</h2>
        <button
          onClick={onClose}
          className={`${
            theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
          } transition-colors`}
        >
          Kapat
        </button>
      </div>
      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.user_id}
            className={`flex items-center justify-between p-3 ${
              theme === 'dark' ? 'bg-gray-700/30' : 'bg-gray-100/50'
            } rounded-xl`}
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div 
                className="w-10 h-10 rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  console.log('Profil sayfasına yönlendiriliyor:', user.user_email);
                  navigate(`/user/${encodeURIComponent(user.user_email)}`);
                }}
              >
              {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={getUserDisplayName(user)}
                    className="w-full h-full object-cover"
                  />
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                } border border-gray-600`}>
                  <User className="w-5 h-5 text-gray-400" />
                </div>
              )}
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  {user.user_id === ownerUser?.user_id && (
                    <Crown className="w-5 h-5 text-yellow-500" />
                  )}
                  <span className={`font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>{getUserDisplayName(user)}</span>
                </div>
                {/* İsim ve e-posta farklıysa, e-postayı da göster */}
                {(user.first_name || user.last_name) && (
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>{user.user_email}</span>
                )}
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