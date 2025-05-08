import React, { useState, useEffect } from 'react';
import { MessageCircle, UserCircle } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import AuthForm from './components/AuthForm';
import RoomView from './components/RoomView';
import RoomList from './components/RoomList';
import ProfileSettings from './components/ProfileSettings';
import LandingPage from './components/LandingPage';
import ThemeToggle from './components/ThemeToggle';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './contexts/ThemeContext';
import { supabase } from './lib/supabase';
import { motion } from 'framer-motion';

function App() {
  const { session, signOut } = useAuth();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [missingFullname, setMissingFullname] = useState(false);

  useEffect(() => {
    if (!session && selectedRoomId) {
      setSelectedRoomId(null);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      const checkUserRooms = async () => {
        // ... existing code ...
      };

      checkUserRooms();
      
      const checkUserProfile = async () => {
        try {
          console.log('Kullanıcı profili kontrol ediliyor...');
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('fullname')
            .eq('id', session.user.id)
            .single();
            
          if (error) {
            console.error('Profil bilgisi alınırken hata oluştu:', error);
            return;
          }
          
          console.log('Profil durumu:', profile);
          
          // Eğer kullanıcının isim soyisim bilgisi yoksa açılır pencereyi göster
          if (!profile || !profile.fullname) {
            console.log('İsim soyisim eksik, form gösteriliyor');
            setMissingFullname(true);
          } else {
            console.log('İsim soyisim mevcut:', profile.fullname);
            setMissingFullname(false);
          }
        } catch (error) {
          console.error('Profil kontrolünde hata:', error);
        }
      };
      
      checkUserProfile();
    }
  }, [session]);

  const handleSignOut = async () => {
    try {
      if (session) {
        await supabase
          .from('room_users')
          .delete()
          .eq('user_id', session.user.id);
      }
      
      await signOut();
      setSelectedRoomId(null);
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  if (!session && !showAuth) {
    return <LandingPage onAuthClick={() => setShowAuth(true)} />;
  }

  if (!session && showAuth) {
    return <AuthForm setIsLoading={setIsLoading} onBack={() => setShowAuth(false)} />;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white' : 'bg-gradient-to-br from-blue-50 to-white text-gray-900'}`}>
      <Toaster position="top-center" />
      {session && (
        <div className="container mx-auto px-4 py-8">
          <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2">
              <MessageCircle className={`w-8 h-8 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <h1 className="text-2xl font-bold">Study Room</h1>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <ThemeToggle />
              {selectedRoomId && (
                <button
                  onClick={async () => {
                    try {
                      await supabase
                        .from('room_users')
                        .delete()
                        .eq('user_id', session.user.id)
                        .eq('room_id', selectedRoomId);

                      setSelectedRoomId(null);
                    } catch (error) {
                      console.error('Error leaving room:', error);
                    }
                  }}
                  className={`px-4 py-2 ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-200 hover:bg-gray-300'
                  } rounded-lg transition-colors`}
                >
                  Leave Room
                </button>
              )}
              <button
                onClick={() => setShowProfileSettings(true)}
                className={`px-4 py-2 ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300'
                } rounded-lg transition-colors flex items-center gap-2`}
              >
                <UserCircle className="w-5 h-5" />
                Profil
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors text-white"
                disabled={isLoading}
              >
                Sign Out
              </button>
            </div>
          </header>

          <main>
            {selectedRoomId ? (
              <RoomView session={session} roomId={selectedRoomId} />
            ) : (
              <RoomList session={session} onRoomSelect={setSelectedRoomId} />
            )}
          </main>
        </div>
      )}

      {showProfileSettings && (
        <ProfileSettings onClose={() => setShowProfileSettings(false)} />
      )}
      
      {missingFullname && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } rounded-2xl p-6 max-w-md w-full`}
          >
            <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Profilinizi Tamamlayın
            </h2>
            <p className={`mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Çalışma odalarında daha iyi bir deneyim için lütfen isim ve soyisminizi giriniz.
            </p>
            <ProfileSettings 
              onClose={() => {
                // Profil kapatıldıktan sonra profilin güncellendiğini kontrol et
                const checkProfileUpdated = async () => {
                  if (!session) return;
                  
                  const { data } = await supabase
                    .from('profiles')
                    .select('fullname')
                    .eq('id', session.user.id)
                    .single();
                    
                  if (data && data.fullname) {
                    setMissingFullname(false);
                  }
                };
                
                checkProfileUpdated();
              }} 
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default App;