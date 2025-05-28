import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {   MessageCircle,   Video,   Home,   Users,   User,   Settings,   LogOut,   Menu,  X,  Info,  ArrowLeft} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {  const { user, signOut, currentRoomId } = useAuth();  const { theme } = useTheme();  const location = useLocation();  const navigate = useNavigate();  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/rooms', label: 'Odalar', icon: Users },
    { path: '/profile', label: 'Profil', icon: User },
    { path: '/settings', label: 'Ayarlar', icon: Settings },
    { path: '/about', label: 'Hakkında', icon: Info },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
      theme === 'dark' 
        ? 'bg-gray-900/80 border-gray-800' 
        : 'bg-white/80 border-gray-200'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/rooms" className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-8 h-8 text-blue-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Study Room
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-gray-300 dark:border-gray-600">
              <Video className="w-6 h-6 text-orange-500" />
              <span className="text-lg font-semibold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Watch Room
              </span>
            </div>
          </Link>

                    {/* Desktop Navigation */}          <div className="hidden md:flex items-center space-x-6">            {/* Back to Room Button */}            {currentRoomId && location.pathname !== `/room/${currentRoomId}` && (              <motion.button                whileHover={{ scale: 1.05 }}                whileTap={{ scale: 0.95 }}                onClick={() => navigate(`/room/${currentRoomId}`)}                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${                  theme === 'dark'                    ? 'bg-green-600 hover:bg-green-700 text-white'                    : 'bg-green-500 hover:bg-green-600 text-white'                }`}              >                <ArrowLeft className="w-4 h-4" />                <span className="font-medium">Odaya Dön</span>              </motion.button>            )}                        {navItems.map((item) => {              const Icon = item.icon;              const isActive = location.pathname === item.path;                            return (                <Link                  key={item.path}                  to={item.path}                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${                    isActive                      ? theme === 'dark'                        ? 'bg-blue-600 text-white'                        : 'bg-blue-500 text-white'                      : theme === 'dark'                        ? 'text-gray-300 hover:text-white hover:bg-gray-800'                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'                  }`}                >                  <Icon className="w-4 h-4" />                  <span className="font-medium">{item.label}</span>                </Link>              );            })}          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {user?.email}
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Çıkış</span>
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg ${
              theme === 'dark' 
                ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`md:hidden py-4 border-t ${
              theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
            }`}
          >
                        <div className="space-y-2">              {/* Mobile Back to Room Button */}              {currentRoomId && location.pathname !== `/room/${currentRoomId}` && (                <button                  onClick={() => {                    navigate(`/room/${currentRoomId}`);                    setIsMobileMenuOpen(false);                  }}                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${                    theme === 'dark'                      ? 'bg-green-600 hover:bg-green-700 text-white'                      : 'bg-green-500 hover:bg-green-600 text-white'                  }`}                >                  <ArrowLeft className="w-5 h-5" />                  <span className="font-medium">Odaya Dön</span>                </button>              )}                            {navItems.map((item) => {                const Icon = item.icon;                const isActive = location.pathname === item.path;                                return (                  <Link                    key={item.path}                    to={item.path}                    onClick={() => setIsMobileMenuOpen(false)}                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${                      isActive                        ? theme === 'dark'                          ? 'bg-blue-600 text-white'                          : 'bg-blue-500 text-white'                        : theme === 'dark'                          ? 'text-gray-300 hover:text-white hover:bg-gray-800'                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'                    }`}                  >                    <Icon className="w-5 h-5" />                    <span className="font-medium">{item.label}</span>                  </Link>                );              })}
              
              <div className="pt-4 border-t border-gray-300 dark:border-gray-600 space-y-3">
                <div className="flex items-center justify-between px-4">
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Tema
                  </span>
                  <ThemeToggle />
                </div>
                
                <div className={`px-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {user?.email}
                </div>
                
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Çıkış Yap</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
} 