import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { User, Clock, Users, ArrowLeft } from 'lucide-react';

interface UserStats {
  total_rooms_joined: number;
  total_study_minutes: number;
}

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  email: string;
}

export default function UserProfilePage() {
  const { email } = useParams<{ email: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({ total_rooms_joined: 0, total_study_minutes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!email) return;

      try {
        // Kullanıcı bilgilerini profiles tablosundan çek
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single();

        if (profileError || !profile) {
          console.error('Profil bilgileri alınamadı:', profileError);
          setUserProfile(null);
          setUserStats({ total_rooms_joined: 0, total_study_minutes: 0 });
          setLoading(false);
          return;
        }

        // İstatistikleri çek
        const { data: stats, error: statsError } = await supabase
          .from('user_statistics')
          .select('total_rooms_joined, total_study_minutes')
          .eq('user_id', profile.id)
          .single();

        if (statsError) {
          console.error('İstatistikler alınamadı:', statsError);
        }

        setUserProfile({
          first_name: profile.first_name,
          last_name: profile.last_name,
          avatar_url: profile.avatar_url,
          cover_image_url: profile.cover_image_url,
          email: email
        });

        setUserStats({
          total_rooms_joined: stats?.total_rooms_joined || 0,
          total_study_minutes: stats?.total_study_minutes || 0
        });

        setLoading(false);
      } catch (error) {
        console.error('Veri çekme hatası:', error);
        setUserProfile(null);
        setUserStats({ total_rooms_joined: 0, total_study_minutes: 0 });
        setLoading(false);
      }
    };

    fetchUserData();
  }, [email]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!userProfile) {
    return null;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Geri Butonu */}
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 mb-6 px-4 py-2 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
            } transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" />
            Geri
          </button>

          {/* Profil Kartı */}
          <div className={`rounded-2xl overflow-hidden shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Kapak Fotoğrafı */}
            <div className="relative h-96 bg-gradient-to-r from-blue-500 to-purple-600">
              {userProfile.cover_image_url && (
                <img
                  src={userProfile.cover_image_url}
                  alt="Kapak Fotoğrafı"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-black bg-opacity-40" />
              
              {/* Profil Fotoğrafı */}
              <div className="absolute -bottom-16 left-8">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700">
                    {userProfile.avatar_url ? (
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
            </div>

            {/* Profil Bilgileri */}
            <div className="pt-20 pb-8 px-8">
              <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {userProfile.first_name || userProfile.last_name
                  ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
                  : userProfile.email}
              </h1>
              {(userProfile.first_name || userProfile.last_name) && (
                <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {userProfile.email}
                </p>
              )}
            </div>

            {/* İstatistikler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <Clock className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Toplam Çalışma Süresi
                    </h3>
                    <p className={`text-2xl font-bold text-blue-500`}>
                      {Math.floor(userStats.total_study_minutes / 60)} saat
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <div className="flex items-center gap-4">
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
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}