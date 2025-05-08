import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserX, Crown, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

interface RoomMembersProps {
  users: Array<{
    user_id: string;
    user_email: string;
  }>;
  isOwner: boolean;
  onKickUser: (userId: string) => void;
  onClose: () => void;
}

interface UserProfileInfo {
  id: string;
  email: string;
  fullname: string | null;
  avatar_url: string | null;
}

export default function RoomMembers({ users, isOwner, onKickUser, onClose }: RoomMembersProps) {
  const ownerUser = users[0]; // First user is always the owner
  const { theme } = useTheme();
  const [userProfiles, setUserProfiles] = useState<UserProfileInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfileInfo | null>(null);

  useEffect(() => {
    const fetchUserProfiles = async () => {
      try {
        // Profil bilgilerini getir
        const { data, error } = await supabase
          .from('profiles')
          .select('id, fullname, avatar_url')
          .in('id', users.map(user => user.user_id));
          
        if (error) throw error;
        
        // Kullanıcı bilgileriyle profil bilgilerini birleştir
        const profiles = users.map(user => {
          const profile = data.find(p => p.id === user.user_id);
          return {
            id: user.user_id,
            email: user.user_email,
            fullname: profile?.fullname || null,
            avatar_url: profile?.avatar_url || null
          };
        });
        
        setUserProfiles(profiles);
      } catch (error) {
        console.error('Kullanıcı profil bilgileri alınırken hata oluştu:', error);
      }
    };
    
    fetchUserProfiles();
  }, [users]);

  const handleShowProfile = (user: UserProfileInfo) => {
    setSelectedUser(user);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`mb-6 ${
          theme === 'dark' 
            ? 'bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50' 
            : 'bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 shadow-xl'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Oda Üyeleri ({users.length})</h2>
          <button
            onClick={onClose}
            className={`${
              theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            } transition-colors`}
          >
            Kapat
          </button>
        </div>
        <div className="space-y-2">
          {userProfiles.map((user) => (
            <div
              key={user.id}
              className={`flex items-center justify-between p-3 ${
                theme === 'dark' 
                  ? 'bg-gray-700/30 hover:bg-gray-700/50' 
                  : 'bg-gray-100 hover:bg-gray-200'
              } rounded-xl transition-colors cursor-pointer`}
              onClick={() => handleShowProfile(user)}
            >
              <div className="flex items-center gap-3">
                {/* Profil Fotoğrafı */}
                <div className="flex-shrink-0">
                  {user.avatar_url ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <img
                        src={user.avatar_url}
                        alt={user.fullname || user.email}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                    }`}>
                      <User className={`w-5 h-5 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`} />
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    {user.id === ownerUser?.user_id && (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="font-medium">{user.fullname || 'İsimsiz Kullanıcı'}</span>
                  </div>
                  <p className={`text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {user.email}
                  </p>
                </div>
              </div>
              
              {isOwner && user.id !== ownerUser?.user_id && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onKickUser(user.id);
                  }}
                  className={`p-2 ${
                    theme === 'dark'
                      ? 'text-red-400 hover:text-red-300 hover:bg-red-500/20'
                      : 'text-red-500 hover:text-red-600 hover:bg-red-500/10'
                  } rounded-lg transition-all duration-200`}
                >
                  <UserX className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          ))}
        </div>
      </motion.div>
      
      {/* Profil Görüntüleme Modalı */}
      {selectedUser && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedUser(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } rounded-2xl p-6 max-w-sm w-full`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Kullanıcı Profili
              </h2>
              <button
                onClick={() => setSelectedUser(null)}
                className={`p-2 ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                } rounded-lg transition-colors`}
              >
                <motion.span whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
                  ✕
                </motion.span>
              </button>
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-500/40">
                {selectedUser.avatar_url ? (
                  <img 
                    src={selectedUser.avatar_url} 
                    alt={selectedUser.fullname || selectedUser.email} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <User className={`w-12 h-12 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`} />
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-bold">{selectedUser.fullname || 'İsimsiz Kullanıcı'}</h3>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {selectedUser.email}
                </p>
                
                {selectedUser.id === ownerUser?.user_id && (
                  <div className="mt-2 flex items-center justify-center gap-1 text-yellow-500">
                    <Crown className="w-4 h-4" />
                    <span className="text-sm">Oda Sahibi</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}