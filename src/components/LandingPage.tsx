import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, MessageSquare, ArrowRight, BookOpen, Target, Coffee, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onAuthClick: () => void;
}

export default function LandingPage({ onAuthClick }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-gray-900 text-white overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-indigo-950/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <BookOpen className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
              Study Room
            </span>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAuthClick}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold shadow-lg hover:shadow-blue-500/30 transition-all duration-200 flex items-center gap-2"
          >
            <span>Başla</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-36 pb-20">
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
                Yeni Nesil Çalışma Alanı
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text leading-tight">
              Birlikte Çalış, Daha Fazla Başar
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Odaklanmış öğrencilerin topluluğuna katıl. Çalışma odaları oluştur, ilerlemeyi birlikte takip et ve gerçek zamanlı işbirliği ile motive kal.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAuthClick}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold shadow-lg hover:shadow-blue-500/30 transition-all duration-200 text-lg"
            >
              Hemen Çalışmaya Başla
            </motion.button>
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
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-y border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl shadow-xl group hover:bg-white/5 transition-all duration-300 bg-gray-800/40"
            >
              <div className="w-14 h-14 bg-blue-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500/30 transition-all">
                <Clock className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Çalışma Zamanlayıcısı</h3>
              <p className="text-gray-300">
                Senkronize zamanlayıcı ile çalışma seanslarını takip et. Herkesin ilerlemesini gerçek zamanlı olarak gör.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-8 rounded-2xl shadow-xl group hover:bg-white/5 transition-all duration-300 bg-gray-800/40"
            >
              <div className="w-14 h-14 bg-purple-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500/30 transition-all">
                <MessageSquare className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Gerçek Zamanlı Sohbet</h3>
              <p className="text-gray-300">
                Çalışma grubunla anında iletişim kur. Fikirleri paylaş ve bağlantıda kal.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="p-8 rounded-2xl shadow-xl group hover:bg-white/5 transition-all duration-300 bg-gray-800/40"
            >
              <div className="w-14 h-14 bg-pink-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-pink-500/30 transition-all">
                <Users className="w-7 h-7 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Çalışma Odaları</h3>
              <p className="text-gray-300">
                Grubun için özel çalışma odaları oluştur. Erişimi yönet ve alanını odaklanmış tut.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text"
          >
            Nasıl Çalışır
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-all bg-blue-500/10">
                <Target className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Oluştur veya Katıl</h3>
              <p className="text-gray-300">
                Kendi çalışma odanı oluştur veya şifre ile mevcut bir odaya katıl.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center group"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center group-hover:bg-purple-500/20 transition-all bg-purple-500/10">
                <Users className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Birlikte Çalış</h3>
              <p className="text-gray-300">
                Zamanlayıcını başlat ve gerçek zamanlı olarak arkadaşlarınla birlikte çalış.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-center group"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center group-hover:bg-pink-500/20 transition-all bg-pink-500/10">
                <Coffee className="w-8 h-8 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Motive Kal</h3>
              <p className="text-gray-300">
                Birbirinizi motive edin ve ilerlemelerinizi birlikte kutlayın.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
              Çalışma Yolculuğuna Başlamaya Hazır mısın?
            </h2>
            <p className="text-gray-300 mb-8">
              Odaklanmış öğrencilerin topluluğuna katıl ve hedeflerine birlikte ulaş.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAuthClick}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold shadow-lg hover:shadow-blue-500/30 transition-all duration-200 text-lg"
            >
              Hemen Başla
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}