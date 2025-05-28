import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AdManager from '../components/AdManager';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Settings, 
  Bell, 
  Palette, 
  Shield, 
  Volume2, 
  Monitor,
  Smartphone,
  Globe,
  Save
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoJoinRooms, setAutoJoinRooms] = useState(false);

  if (!user) {
    return null;
  }

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
              <div className="flex items-center gap-3 mb-8">
                <Settings className={`w-8 h-8 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Ayarlar
                </h1>
              </div>

              <div className="space-y-8">
                {/* Appearance Settings */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Palette className={`w-6 h-6 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                    <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Görünüm
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Tema
                        </h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Koyu veya açık tema seçin
                        </p>
                      </div>
                      <ThemeToggle />
                    </div>
                  </div>
                </motion.div>

                {/* Notification Settings */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Bell className={`w-6 h-6 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`} />
                    <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Bildirimler
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Bildirimler
                        </h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Oda davetleri ve mesajlar için bildirim al
                        </p>
                      </div>
                      <button
                        onClick={() => setNotifications(!notifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notifications ? 'bg-blue-600' : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            notifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* Audio Settings */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Volume2 className={`w-6 h-6 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                    <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Ses
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Ses Efektleri
                        </h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Mesaj ve bildirim sesleri
                        </p>
                      </div>
                      <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          soundEnabled ? 'bg-green-600' : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            soundEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* Privacy Settings */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Shield className={`w-6 h-6 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                    <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Gizlilik
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Otomatik Oda Katılımı
                        </h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Davet edilen odalara otomatik katıl
                        </p>
                      </div>
                      <button
                        onClick={() => setAutoJoinRooms(!autoJoinRooms)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          autoJoinRooms ? 'bg-red-600' : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            autoJoinRooms ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* Save Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-end"
                >
                  <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
                    <Save className="w-4 h-4" />
                    Ayarları Kaydet
                  </button>
                </motion.div>
              </div>
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-[300px] flex-shrink-0">
            <AdManager />
          </aside>
        </motion.div>
      </div>
    </div>
  );
} 