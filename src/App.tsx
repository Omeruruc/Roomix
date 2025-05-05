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
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white' : 'bg-gradient-to-br from-blue-50 to-white text-gray-900'}`}>
      <Toaster position="top-center" />
      {session && (
        <div className="container mx-auto px-4 py-8">
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <MessageCircle className={`w-8 h-8 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <h1 className="text-2xl font-bold">Study Room</h1>
            </div>
            <div className="flex items-center gap-4">
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
                Profile
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
    </div>
  );
}

export default App;