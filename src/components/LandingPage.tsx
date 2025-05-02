import React from 'react';
import { BookOpen, Clock, Users, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold">Study Room</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/auth"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            >
              Oturum Aç
            </Link>
            <Link
              to="/auth?mode=signup"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Hesap Oluştur
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto">
          <section className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Birlikte Çalışmanın Yeni Yolu</h2>
            <p className="text-xl text-gray-300">
              Arkadaşlarınızla aynı odada çalışın, kronometrelerinizi senkronize edin ve motivasyonunuzu artırın.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-gray-800 p-6 rounded-lg">
              <Clock className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Senkronize Kronometre</h3>
              <p className="text-gray-300">
                Odadaki herkesin çalışma sürelerini takip edin ve birlikte motive olun.
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <Users className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Sanal Çalışma Odaları</h3>
              <p className="text-gray-300">
                Arkadaşlarınızla özel çalışma odaları oluşturun ve birlikte çalışın.
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <MessageSquare className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Anlık Mesajlaşma</h3>
              <p className="text-gray-300">
                Çalışma sırasında arkadaşlarınızla iletişim kurun ve motivasyonunuzu artırın.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/auth"
              className="inline-block px-8 py-4 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors text-xl font-semibold"
            >
              Hemen Başla
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LandingPage; 