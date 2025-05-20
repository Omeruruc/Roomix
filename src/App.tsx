import React, { useState, useEffect } from 'react';
import { MessageCircle, UserCircle, Video } from 'lucide-react';
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

function App() {
  const { session, signOut } = useAuth();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [roomType, setRoomType] = useState<'study' | 'watch'>('study');

  // Sayfa ilk yüklendiğinde localStorage'dan oda bilgisini al
  useEffect(() => {
    const savedRoomId = localStorage.getItem('selectedRoomId');
    if (savedRoomId && session) {
      // Odanın hala var olup olmadığını kontrol et
      const checkRoom = async () => {
        const { data: roomExists } = await supabase
          .from('rooms')
          .select('id')
          .eq('id', savedRoomId)
          .single();

        if (roomExists) {
          setSelectedRoomId(savedRoomId);
        } else {
          localStorage.removeItem('selectedRoomId');
        }
      };
      
      checkRoom();
    }
  }, [session]);

  // Kullanıcı odaya katıldığında veya odadan çıktığında localStorage'ı güncelle
  const handleRoomSelect = async (roomId: string | null) => {
    if (roomId) {
      localStorage.setItem('selectedRoomId', roomId);
      setSelectedRoomId(roomId);
    } else {
      localStorage.removeItem('selectedRoomId');
      setSelectedRoomId(null);
    }
  };

  const handleSignOut = async () => {
    try {
      if (session) {
        await supabase
          .from('room_users')
          .delete()
          .eq('user_id', session.user.id);
      }
      
      localStorage.removeItem('selectedRoomId');
      setSelectedRoomId(null);
      await signOut();
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  // Fetch room type when selected room changes
  useEffect(() => {
    if (selectedRoomId) {
      const fetchRoomType = async () => {
        const { data } = await supabase
          .from('rooms')
          .select('room_type')
          .eq('id', selectedRoomId)
          .single();
          
        if (data) {
          setRoomType(data.room_type || 'study');
        }
      };
      
      fetchRoomType();
    }
  }, [selectedRoomId]);

  if (!session && !showAuth) {
    return <LandingPage onAuthClick={() => setShowAuth(true)} />;
  }

  if (!session && showAuth) {
    return <AuthForm setIsLoading={setIsLoading} onBack={() => setShowAuth(false)} />;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-blue-50 text-gray-900'}`}>
      <Toaster position="top-center" />
      {session && (
        <div className="container mx-auto px-4 py-8">
          <header className={`flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 p-4 rounded-2xl shadow-lg ${theme === 'dark' ? 'bg-gray-800/80' : 'bg-white'}`}>
            <div className="flex items-center gap-2">
              {roomType === 'study' ? (
                <MessageCircle className={`w-8 h-8 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              ) : (
                <Video className={`w-8 h-8 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
              )}
              <h1 className={`text-2xl font-bold bg-gradient-to-r ${
                roomType === 'study' 
                  ? 'from-blue-500 to-purple-600' 
                  : 'from-orange-500 to-red-600'
              } bg-clip-text text-transparent`}>
                {roomType === 'study' ? 'Study Room' : 'Watch Room'}
              </h1>
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

                      handleRoomSelect(null);
                    } catch (error) {
                      console.error('Error leaving room:', error);
                    }
                  }}
                  className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2
                    ${theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-100 hover:bg-gray-200'
                    } font-medium`}
                >
                  Leave Room
                </button>
              )}
              <button
                onClick={() => setShowProfileSettings(true)}
                className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2
                  ${theme === 'dark'
                    ? 'bg-blue-600 hover:bg-blue-500'
                    : 'bg-blue-500 hover:bg-blue-400 text-white'
                  } font-medium`}
              >
                <UserCircle className="w-5 h-5" />
                Profile
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl transition-all duration-300 text-white font-medium"
                disabled={isLoading}
              >
                Sign Out
              </button>
            </div>
          </header>

          <main className={`rounded-2xl overflow-hidden shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            {selectedRoomId ? (
              <RoomView session={session} roomId={selectedRoomId} onLeaveRoom={() => handleRoomSelect(null)} />
            ) : (
              <RoomList session={session} onRoomSelect={handleRoomSelect} />
            )}
          </main>
        </div>
      )}

      {showProfileSettings && (
        <ProfileSettings onClose={() => setShowProfileSettings(false)} />
      )}
    </div>
  );
}

export default App;