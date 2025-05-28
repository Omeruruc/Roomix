import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdManager from '../components/AdManager';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Heart, 
  Users, 
  Video, 
  MessageCircle, 
  Timer, 
  Shield,
  Github,
  Mail,
  Globe,
  Star,
  BrainCircuit,
  Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DatabaseStats {
  totalUsers: number;
  totalRooms: number;
  uptime: string;
}

export default function AboutPage() {
  const { theme } = useTheme();
  const [stats, setStats] = useState<DatabaseStats>({
    totalUsers: 0,
    totalRooms: 0,
    uptime: '99.8%'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealStats = async () => {
      try {
        // Toplam kullanıcı sayısını auth.users tablosundan getir
        const { count: userCount } = await supabase
          .from('auth.users')
          .select('id', { count: 'exact', head: true });

        // Toplam oda sayısını getir
        const { count: roomCount } = await supabase
          .from('rooms')
          .select('id', { count: 'exact', head: true });

        setStats({
          totalUsers: userCount || 0,
          totalRooms: roomCount || 0,
          uptime: '99.8%'
        });
      } catch (error) {
        console.error('İstatistikler alınırken hata:', error);
        // Fallback: profiles tablosundan dene
        try {
          const { count: profileCount } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true });

          const { count: roomCount } = await supabase
            .from('rooms')
            .select('id', { count: 'exact', head: true });

          setStats({
            totalUsers: profileCount || 0,
            totalRooms: roomCount || 0,
            uptime: '99.8%'
          });
        } catch (fallbackError) {
          console.error('Fallback istatistik alma hatası:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRealStats();
  }, []);

  const features = [
    {
      icon: Users,
      title: 'Birlikte Çalışma',
      description: 'Arkadaşlarınızla gerçek zamanlı olarak çalışın ve motive olun.',
      color: 'text-blue-500'
    },
    {
      icon: Video,
      title: 'Video İzleme',
      description: 'YouTube ve diğer platformlardan videolarınızı birlikte izleyin.',
      color: 'text-red-500'
    },
    {
      icon: Timer,
      title: 'Pomodoro Zamanlayıcı',
      description: 'Verimlilik odaklı çalışma seansları için zamanlayıcı.',
      color: 'text-green-500'
    },
    {
      icon: MessageCircle,
      title: 'Gerçek Zamanlı Sohbet',
      description: 'Odalar içinde anlık mesajlaşma ve emoji desteği.',
      color: 'text-purple-500'
    },
    {
      icon: BrainCircuit,
      title: 'AI Eğitim Koçu',
      description: 'Yapay zeka destekli kişiselleştirilmiş çalışma planları.',
      color: 'text-orange-500'
    },
    {
      icon: Shield,
      title: 'Güvenli Platform',
      description: 'End-to-end şifreleme ile güvenli iletişim.',
      color: 'text-indigo-500'
    }
  ];

  const displayStats = [
    { number: loading ? '...' : stats.totalUsers.toLocaleString(), label: 'Kullanıcı' },
    { number: loading ? '...' : stats.totalRooms.toLocaleString(), label: 'Oluşturulan Oda' },
    { number: stats.uptime, label: 'Uptime' }
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-8"
        >
          {/* Left Sidebar */}
          <aside className="hidden lg:block w-[300px] flex-shrink-0">
            <AdManager />
          </aside>

          {/* Main Content */}
          <main className={`flex-1 rounded-2xl overflow-hidden shadow-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-8">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Study & Watch Room
                  </h1>
                </div>
                <p className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
                  Birlikte çalışmayı, öğrenmeyi ve eğlenmeyi birleştiren yeni nesil platform. 
                  Arkadaşlarınızla bağlantıda kalın, motivasyonunuzu artırın.
                </p>
              </motion.div>

              {/* Features Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-12"
              >
                <h2 className={`text-2xl font-bold mb-8 text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Özellikler
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      whileHover={{ scale: 1.05, boxShadow: '0 8px 32px 0 rgba(31,38,135,0.37)' }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className={`flex flex-col items-center bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-7 shadow-xl border-t-4 ${feature.color} transition-all`}
                    >
                      <div className={`w-14 h-14 flex items-center justify-center rounded-full mb-4 ${feature.color} bg-opacity-20`}>
                        <feature.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-1 text-center">{feature.title}</h3>
                      <p className="text-sm text-gray-300 text-center">{feature.description}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-12"
              >
                <h2 className={`text-2xl font-bold mb-8 text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  İstatistikler
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {displayStats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * index }}
                      className="text-center"
                    >
                      <div className="text-3xl font-bold text-blue-500 mb-2">
                        {stat.number}
                      </div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Team */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-12"
              >
                <h2 className={`text-2xl font-bold mb-8 text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Ekibimiz
                </h2>
                <div className={`p-8 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
                  <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Study & Watch Room, öğrenciler ve uzaktan çalışanlar için daha iyi bir deneyim 
                    yaratma tutkusuyla geliştirilmektedir. Teknoloji ve eğitimi birleştirerek, 
                    herkesin daha verimli ve motive bir şekilde çalışmasını sağlamayı hedefliyoruz.
                  </p>
                </div>
              </motion.div>

              {/* Contact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <h2 className={`text-2xl font-bold mb-6 text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  İletişim
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <a 
                    href="mailto:studyroomix@gmail.com"
                    className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} text-center transition-colors cursor-pointer`}
                  >
                    <Mail className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                    <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      E-posta
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      studyroomix@gmail.com
                    </p>
                  </a>
                  
                  <a
                    href="https://github.com/Omeruruc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} text-center transition-colors cursor-pointer`}
                  >
                    <Github className={`w-8 h-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mx-auto mb-3`} />
                    <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      GitHub
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      @Omeruruc
                    </p>
                  </a>
                  
                  <div className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
                    <Globe className="w-8 h-8 text-green-500 mx-auto mb-3" />
                    <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Web Site
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      studywatchroom.com
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="hidden lg:block w-[300px] flex-shrink-0">
            <AdManager />
          </aside>
        </motion.div>
      </div>
    </div>
  );
} 