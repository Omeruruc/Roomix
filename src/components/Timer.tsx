import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function Timer() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRunning) {
      intervalId = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handleStop = async () => {
    if (!user) return;
    
    const totalMinutes = Math.floor(elapsedTime / 60);
    
    try {
      // Mevcut istatistikleri al
      const { data: currentStats, error: fetchError } = await supabase
        .from('user_statistics')
        .select('total_study_minutes')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Yeni toplam dakikayı hesapla
      const newTotalMinutes = (currentStats?.total_study_minutes || 0) + totalMinutes;

      // İstatistikleri güncelle
      const { error: updateError } = await supabase
        .from('user_statistics')
        .upsert({
          user_id: user.id,
          total_study_minutes: newTotalMinutes
        });

      if (updateError) throw updateError;

      setIsRunning(false);
      setElapsedTime(0);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    } catch (error) {
      console.error('İstatistikler güncellenirken hata:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (showConfetti) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [showConfetti]);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <div className="text-4xl font-bold mb-4">{formatTime(elapsedTime)}</div>
      <div className="flex gap-4">
        {!isRunning ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Başlat
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStop}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Durdur
          </motion.button>
        )}
      </div>
    </div>
  );
} 