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

function App() {
  const { session, signOut } = useAuth();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (!session && selectedRoomId) {
      setSelectedRoomId(null);
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
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-blue-50 text-gray-900'}`}>
      <Toaster position="top-center" />
      {session && (
        <div className="container mx-auto px-4 py-8">
          <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 p-4 rounded-2xl shadow-lg ${theme === 'dark' ? 'bg-gray-800/80' : 'bg-white'}">
            <div className="flex items-center gap-2">
              <MessageCircle className={`w-8 h-8 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Study Room</h1>
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

          <main className="rounded-2xl overflow-hidden shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}">
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
    </div>
  );
}

export default App;