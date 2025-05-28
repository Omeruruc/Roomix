import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Users, MessageSquare, ArrowRight, BookOpen, Target, Coffee, Sparkles, Video, PlayCircle, Timer, BrainCircuit } from 'lucide-react';
import AdComponent from '../components/AdComponent';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-gray-900 text-white overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-indigo-950/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                Study Room
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-white/10">
              <Video className="w-8 h-8 text-orange-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 text-transparent bg-clip-text">
                Watch Room
              </span>
            </div>
          </motion.div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Giriş Yap
            </Link>
            <Link
              to="/register"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold shadow-lg hover:shadow-blue-500/30 transition-all duration-200 flex items-center gap-2"
            >
              <span>Başla</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Header Ad */}
      <div className="w-full px-4 pt-20 pb-8">
        <AdComponent type="header" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div 
              className="flex justify-center items-center gap-2 mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-blue-600/20 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-yellow-400" /> 
                Yeni Nesil Çalışma ve İzleme Platformu
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text leading-tight">
              Birlikte Çalış, İzle ve Daha Fazla Başar
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Odaklanmış çalışma odaları oluştur, arkadaşlarınla film ve videolar izle, ilerlemeyi birlikte takip et ve gerçek zamanlı işbirliği ile motive kal.
            </p>
            <Link
              to="/register"
              className="inline-block px-8 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold shadow-lg hover:shadow-blue-500/30 transition-all duration-200 text-lg"
            >
              Hemen Başla
            </Link>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 left-[20%] w-20 h-20 rounded-full bg-blue-500/10"
          />
          <motion.div
            animate={{
              y: [0, 20, 0],
              rotate: [0, -5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-40 right-[25%] w-24 h-24 rounded-full bg-purple-500/10"
          />
          <motion.div
            animate={{
              y: [0, 15, 0],
              rotate: [0, 3, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-40 left-[30%] w-16 h-16 rounded-full bg-indigo-500/10"
          />
          <motion.div
            animate={{
              y: [0, 25, 0],
              rotate: [0, -3, 0],
            }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-60 right-[20%] w-18 h-18 rounded-full bg-orange-500/10"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Çalışma Arkadaşları</h3>
              <p className="text-gray-300">
                Arkadaşlarınızla birlikte çalışın, motivasyonunuzu artırın ve hedeflerinize birlikte ulaşın.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl"
            >
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                <Timer className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Pomodoro Zamanlayıcı</h3>
              <p className="text-gray-300">
                Pomodoro tekniği ile daha verimli çalışın, odaklanmanızı artırın ve molalarınızı düzenleyin.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 rounded-bl-lg">
                  PRO
                </div>
              </div>
              <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center mb-4">
                <BrainCircuit className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">AI Eğitim Koçu</h3>
              <p className="text-gray-300">
                Yapay zeka destekli eğitim koçu ile kişiselleştirilmiş çalışma planları oluşturun ve akademik başarınızı artırın.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Middle Ad */}
      <div className="w-full px-4 py-8">
        <AdComponent type="content" />
      </div>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text"
          >
            Nasıl Çalışır
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-all bg-blue-500/10">
                <Target className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Oluştur veya Katıl</h3>
              <p className="text-gray-300">
                Kendi çalışma/izleme odanı oluştur veya şifre ile mevcut bir odaya katıl.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="text-center group"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center group-hover:bg-orange-500/20 transition-all bg-orange-500/10">
                <Video className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Video URL'si Ekle</h3>
              <p className="text-gray-300">
                İzlemek istediğin YouTube veya diğer platformlardan video URL'sini ekle.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center group"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center group-hover:bg-purple-500/20 transition-all bg-purple-500/10">
                <Users className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Birlikte İzle</h3>
              <p className="text-gray-300">
                Videoyu başlat ve arkadaşlarınla eş zamanlı olarak izlemeye başla.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.45 }}
              className="text-center group"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center group-hover:bg-pink-500/20 transition-all bg-pink-500/10">
                <Coffee className="w-8 h-8 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Eğlenceyi Paylaş</h3>
              <p className="text-gray-300">
                Sohbet özelliğiyle yorumlarınızı paylaşın ve deneyimi daha keyifli hale getirin.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bottom Ad */}
      <div className="w-full px-4 py-8">
        <AdComponent type="content" />
      </div>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
              Çalışma ve Eğlence Yolculuğuna Başlamaya Hazır mısın?
            </h2>
            <p className="text-gray-300 mb-8">
              Hem çalışmanı hem de eğlenceni paylaşabileceğin topluluğa katıl ve arkadaşlarınla bağlantıda kal.
            </p>
            <Link
              to="/register"
              className="inline-block px-8 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold shadow-lg hover:shadow-blue-500/30 transition-all duration-200 text-lg"
            >
              Hemen Başla
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 