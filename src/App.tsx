import React, { useState, useEffect } from 'react';
import { MessageCircle, UserCircle } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import AuthForm from './components/AuthForm';
import RoomView from './components/RoomView';
import RoomList from './components/RoomList';
import ProfileSettings from './components/ProfileSettings';
import LandingPage from './components/LandingPage';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabase';

function App() {
  const { session, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  // Effect to handle room cleanup on sign out
  useEffect(() => {
    if (!session && selectedRoomId) {
      setSelectedRoomId(null);
    }
  }, [session]);

  const handleSignOut = async () => {
    try {
      // Remove user from all rooms before signing out
      if (session) {
        await supabase
          .from('room_users')
          .delete()
          .eq('user_id', session.user.id);
      }
      
      // Then sign out
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Toaster position="top-center" />
      {session && (
        <div className="container mx-auto px-4 py-8">
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold">Study Room</h1>
            </div>
            <div className="flex items-center gap-4">
              {selectedRoomId && (
                <button
                  onClick={() => setSelectedRoomId(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Leave Room
                </button>
              )}
              <button
                onClick={() => setShowProfileSettings(true)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
              >
                <UserCircle className="w-5 h-5" />
                Profile
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
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