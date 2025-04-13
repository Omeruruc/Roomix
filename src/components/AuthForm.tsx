import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthFormProps {
  setIsLoading: (loading: boolean) => void;
}

export default function AuthForm({ setIsLoading }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [circles, setCircles] = useState<{ x: number; y: number; scale: number }[]>([]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      toast.success('Check your email for the confirmation link!');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2940&auto=format&fit=crop)',
          filter: 'brightness(0.3)'
        }}
      />

      {/* Animated Circles */}
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

      {/* Animated Lines */}
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

      {/* Auth Form */}
      <div className="max-w-md w-full mx-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-white/10 p-8 rounded-2xl shadow-2xl border border-white/20"
        >
          <div className="relative mb-8">
            <div className="relative w-32 h-32 mx-auto">
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600 to-blue-900 border-4 border-blue-500/50"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              />
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h1 
                  className="text-4xl font-bold tracking-wider"
                  style={{ 
                    color: '#1a365d',
                    textShadow: '0 0 15px rgba(59, 130, 246, 0.7)',
                    fontFamily: 'system-ui'
                  }}
                >
                  DING!
                </h1>
              </motion.div>
            </div>
          </div>
          
          <motion.h2 
            className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {isSignUp ? 'Join Ding Chat' : 'Welcome Back'}
          </motion.h2>

          <AnimatePresence mode="wait">
            <motion.form
              key={isSignUp ? 'signup' : 'signin'}
              onSubmit={isSignUp ? handleSubmit : handleSignIn}
              className="space-y-6"
              initial={{ opacity: 0, x: isSignUp ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isSignUp ? -50 : 50 }}
            >
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 rounded-xl border border-white/20 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 text-white placeholder-white/50"
                  placeholder="Email address"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 rounded-xl border border-white/20 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 text-white placeholder-white/50"
                  placeholder="Password"
                  required
                />
              </div>
              <motion.button
                type="submit"
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transform hover:translate-y-[-2px] transition-all duration-200 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSignUp ? (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Create Account
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </>
                )}
              </motion.button>
            </motion.form>
          </AnimatePresence>

          <motion.div 
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-white/70 hover:text-white transition-colors duration-200 text-sm"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}