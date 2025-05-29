import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileSettings from '../components/ProfileSettings';
import AdManager from '../components/AdManager';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { User, Mail, Calendar, Settings as SettingsIcon, Clock, Users, Trophy, BookOpen, Camera, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserStats {
  total_rooms_joined: number;
  total_study_minutes: number;
}

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({ total_rooms_joined: 0, total_study_minutes: 0 });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        // Kullanıcının profil bilgilerini getir
        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_url, cover_image_url')
          .eq('id', user.id)
          .single();

        const { data: nameData } = await supabase
          .from('users_fullname')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();

        setUserProfile({
          first_name: nameData?.first_name || null,
          last_name: nameData?.last_name || null,
          avatar_url: profileData?.avatar_url || null
        });

        // Kapak fotoğrafını ayarla
        setCoverImage(profileData?.cover_image_url || null);

        // Kullanıcının istatistiklerini getir
        const { data: statsData, error: statsError } = await supabase
          .from('user_statistics')
          .select('total_rooms_joined, total_study_minutes')
          .eq('user_id', user.id)
          .single();

        if (statsError) {
          console.error('İstatistikler alınırken hata:', statsError);
        } else {
          setUserStats({
            total_rooms_joined: statsData?.total_rooms_joined || 0,
            total_study_minutes: statsData?.total_study_minutes || 0
          });
        }

      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const getUserDisplayName = () => {
    if (userProfile?.first_name && userProfile.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`;
    }
    return user?.email || 'Kullanıcı';
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploadingCover(true);
      
      // Dosya boyutu kontrolü (5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Dosya boyutu 5MB\'dan küçük olmalıdır');
      }

      // Dosya tipi kontrolü
      if (!file.type.startsWith('image/')) {
        throw new Error('Lütfen geçerli bir resim dosyası seçin');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-cover-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Dosyayı yükle
      const { error: uploadError } = await supabase.storage
        .from('cover_images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Dosya URL'sini al
      const { data: { publicUrl } } = supabase.storage
        .from('cover_images')
        .getPublicUrl(filePath);

      // Profili güncelle
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_image_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setCoverImage(publicUrl);
    } catch (error: any) {
      console.error('Kapak fotoğrafı yüklenirken hata:', error.message);
      alert(error.message);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const removeCoverImage = async () => {
    if (!user || !coverImage) return;

    try {
      setIsUploadingCover(true);

      // Profili güncelle
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_image_url: null })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setCoverImage(null);
    } catch (error) {
      console.error('Kapak fotoğrafı kaldırılırken hata:', error);
    } finally {
      setIsUploadingCover(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-6"
        >
          {/* Main Content */}
          <main className="flex-1 space-y-6">
            {/* Profile Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl overflow-hidden shadow-xl ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <div className="relative h-96 bg-gradient-to-r from-blue-500 to-purple-600">
                {coverImage && (
                  <img
                    src={coverImage}
                    alt="Kapak Fotoğrafı"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-40">
                  {/* Üç Nokta Menüsü */}
                  <div className="absolute top-4 right-4">
                    <div className="relative group">
                      <button className="p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                      <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        <div className="py-1">
                          <label className="w-full cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCoverImageUpload}
                              className="hidden"
                              disabled={isUploadingCover}
                            />
                            <div className={`flex items-center gap-2 px-4 py-2 text-sm ${
                              theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                            }`}>
                              <Camera className="w-4 h-4" />
                              {isUploadingCover ? 'Yükleniyor...' : 'Fotoğraf Yükle'}
                            </div>
                          </label>
                          {coverImage && (
                            <button
                              onClick={removeCoverImage}
                              disabled={isUploadingCover}
                              className={`w-full flex items-center gap-2 px-4 py-2 text-sm ${
                                theme === 'dark' 
                                  ? 'text-red-400 hover:bg-gray-700 hover:text-red-300' 
                                  : 'text-red-600 hover:bg-gray-100 hover:text-red-500'
                              }`}
                            >
                              <X className="w-4 h-4" />
                              Kaldır
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Profil Fotoğrafı */}
                <div className="absolute -bottom-16 left-8">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => userProfile?.avatar_url && setSelectedAvatar(userProfile.avatar_url)}>
                      {userProfile?.avatar_url ? (
                        <img
                          src={userProfile.avatar_url}
                          alt="Profil"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Ayarlar Butonu */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSettings(true)}
                  className="absolute top-4 right-16 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-sm transition-all duration-200"
                >
                  <SettingsIcon className="w-4 h-4" />
                  Ayarlar
                </motion.button>
              </div>
              <div className="pt-20 pb-8 px-8">
                <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {getUserDisplayName()}
                </h1>
                <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {user?.email}
                </p>
              </div>
            </motion.div>

            {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                className={`p-6 rounded-xl shadow-lg ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}
                >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <BookOpen className="w-6 h-6 text-blue-500" />
                  </div>
                      <div>
                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Toplam Çalışma Süresi
                    </h3>
                    <p className={`text-2xl font-bold text-blue-500`}>
                      {userStats.total_study_minutes} dakika
                        </p>
                      </div>
                    </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                    style={{ width: `${Math.min((userStats.total_study_minutes / 1000) * 100, 100)}%` }}
                  />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                className={`p-6 rounded-xl shadow-lg ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-purple-500/10">
                    <Users className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Katıldığı Odalar
                  </h3>
                    <p className={`text-2xl font-bold text-purple-500`}>
                      {userStats.total_rooms_joined}
                    </p>
                        </div>
                      </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-600"
                    style={{ width: `${Math.min((userStats.total_rooms_joined / 300) * 100, 100)}%` }}
                  />
                </div>
              </motion.div>
                        </div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-xl shadow-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Son Aktiviteler
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-100 dark:bg-gray-700">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Trophy className="w-5 h-5 text-green-500" />
                        </div>
                  <div>
                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Yeni bir başarı kazandınız!
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      2 saat kesintisiz çalışma
                    </p>
                      </div>
                    </div>
              </div>
            </motion.div>
          </main>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-[300px] flex-shrink-0">
            <AdManager />
          </aside>
        </motion.div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <ProfileSettings onClose={() => setShowSettings(false)} />
      )}

      {/* Resim Modalı */}
      <AnimatePresence>
        {selectedAvatar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setSelectedAvatar(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedAvatar}
                alt="Büyük profil fotoğrafı"
                className="max-w-full max-h-[90vh] rounded-lg object-contain"
              />
              <button
                onClick={() => setSelectedAvatar(null)}
                className={`absolute top-4 right-4 p-2 rounded-full ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                } shadow-lg`}
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 