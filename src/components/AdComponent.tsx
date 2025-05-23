import React, { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface AdComponentProps {
  type: 'sidebar' | 'content' | 'header';
}

export default function AdComponent({ type }: AdComponentProps) {
  const { theme } = useTheme();

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('Reklam yükleme hatası:', err);
    }
  }, []);

  const getAdStyle = () => {
    switch (type) {
      case 'sidebar':
        return 'w-[300px] h-[600px]';
      case 'content':
        return 'w-full h-[250px]';
      case 'header':
        return 'w-full h-[90px]';
      default:
        return 'w-full h-[250px]';
    }
  };

  return (
    <div className={`${getAdStyle()} ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'} backdrop-blur-sm rounded-lg flex items-center justify-center overflow-hidden border border-gray-200/10`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-9908087582423418"
        data-ad-slot={type === 'sidebar' ? '1234567890' : type === 'header' ? '0987654321' : '5678901234'}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
} 