import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { Mail, Lock, LogIn, UserPlus, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface AuthFormProps {
  setIsLoading: (loading: boolean) => void;
  onBack: () => void;
}

export default function AuthForm({ setIsLoading, onBack }: AuthFormProps) {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [circles, setCircles] = useState<{ x: number; y: number; scale: number }[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const newCircles = Array.from({ length: 15 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      scale: 0.5 + Math.random() * 1.5,
    }));
    setCircles(newCircles);
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!validateEmail(email)) {
      setFormError('Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      setFormError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setFormError('This email is already registered. Please sign in instead.');
        } else {
          setFormError(error.message);
        }
        return;
      }
      
      toast.success('Check your email for the confirmation link!');
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateEmail(email)) {
      setFormError('Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      setFormError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setFormError('Incorrect email or password');
        } else {
          setFormError(error.message);
        }
        return;
      }
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2940&auto=format&fit=crop)',
          filter: 'brightness(0.2)'
        }}
      />

      <motion.button
        onClick={onBack}
        className={`absolute top-4 left-4 px-4 py-2 ${
          theme === 'dark'
            ? 'bg-gray-800/50'
            : 'bg-white/50'
        } backdrop-blur-sm rounded-xl text-white flex items-center gap-2 z-50 hover:bg-opacity-70 transition-all duration-200 border border-white/10`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeft className="w-5 h-5" />
        Ana Sayfaya Dön
      </motion.button>

      {circles.map((circle, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full bg-blue-500/20 backdrop-blur-sm"
          initial={{ x: circle.x, y: circle.y, scale: 0 }}
          animate={{
            x: [circle.x - 50, circle.x + 50, circle.x - 50],
            y: [circle.y - 50, circle.y + 50, circle.y - 50],
            scale: circle.scale,
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            width: '150px',
            height: '150px',
          }}
        />
      ))}

      <div className="absolute inset-0">
        <svg className="w-full h-full opacity-30">
          <motion.path
            d="M 0,50 Q 100,100 200,50 T 400,50"
            stroke="rgba(59, 130, 246, 0.5)"
            strokeWidth="2"
            fill="transparent"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </svg>
      </div>

      <div className="max-w-md w-full mx-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`backdrop-blur-xl ${
            theme === 'dark'
              ? 'bg-white/10 border-white/20'
              : 'bg-white/80 border-gray-200'
          } p-8 rounded-2xl shadow-2xl border`}
        >
          <div className="relative mb-8">
            <div className="relative w-32 h-32 mx-auto">
              <motion.div
                className={`absolute inset-0 rounded-full ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-900 border-blue-500/50'
                    : 'bg-gradient-to-br from-blue-400 to-indigo-700 border-blue-400/50'
                } border-4`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
              <motion.div
                className="absolute inset-0 flex items-center justify-center text-white text-5xl font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                {isSignUp ? <UserPlus className="w-16 h-16" /> : <LogIn className="w-16 h-16" />}
              </motion.div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'} bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent`}>
              {isSignUp ? 'Hesap Oluştur' : 'Giriş Yap'}
            </h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {isSignUp
                ? 'E-posta adresinizle ücretsiz hesap oluşturun'
                : 'Hesabınıza giriş yaparak çalışmaya devam edin'}
            </p>
          </div>

          {formError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 rounded-lg bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-200 text-sm"
            >
              {formError}
            </motion.div>
          )}

          <form onSubmit={isSignUp ? handleSubmit : handleSignIn}>
            <div className="mb-6">
              <label
                htmlFor="email"
                className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}
              >
                E-posta Adresi
              </label>
              <div className={`relative rounded-xl overflow-hidden border ${
                theme === 'dark'
                  ? 'bg-white/5 border-white/10 focus-within:border-blue-500/50'
                  : 'bg-white border-gray-300 focus-within:border-blue-500'
              } transition-all duration-200`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`block w-full pl-10 pr-3 py-3 ${
                    theme === 'dark'
                      ? 'bg-transparent text-white placeholder-gray-400'
                      : 'text-gray-900 placeholder-gray-500'
                  } focus:outline-none text-base`}
                  placeholder="email@örnek.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-8">
              <label
                htmlFor="password"
                className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}
              >
                Şifre
              </label>
              <div className={`relative rounded-xl overflow-hidden border ${
                theme === 'dark'
                  ? 'bg-white/5 border-white/10 focus-within:border-blue-500/50'
                  : 'bg-white border-gray-300 focus-within:border-blue-500'
              } transition-all duration-200`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className={`block w-full pl-10 pr-3 py-3 ${
                    theme === 'dark'
                      ? 'bg-transparent text-white placeholder-gray-400'
                      : 'text-gray-900 placeholder-gray-500'
                  } focus:outline-none text-base`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className={`w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 flex items-center justify-center gap-2 border border-white/10`}
            >
              {isSignUp ? (
                <>
                  <UserPlus className="w-5 h-5" />
                  Hesap Oluştur
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Giriş Yap
                </>
              )}
            </motion.button>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className={`text-sm ${
                  theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                } font-medium transition-colors`}
              >
                {isSignUp ? 'Zaten bir hesabınız var mı? Giriş yapın' : 'Hesabınız yok mu? Kayıt olun'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}