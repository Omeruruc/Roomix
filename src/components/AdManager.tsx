import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AdComponent from './AdComponent';

interface AdConfig {
  path: string;
  ads: {
    type: 'sidebar' | 'content' | 'header';
    position: 'top' | 'bottom' | 'left' | 'right' | 'middle';
  }[];
}

const adConfigs: AdConfig[] = [
  {
    path: '/',
    ads: [
      { type: 'header', position: 'top' },
      { type: 'sidebar', position: 'left' },
      { type: 'sidebar', position: 'right' },
      { type: 'content', position: 'bottom' }
    ]
  },
  {
    path: '/room',
    ads: [
      { type: 'header', position: 'top' },
      { type: 'sidebar', position: 'left' },
      { type: 'content', position: 'bottom' }
    ]
  },
  {
    path: '/profile',
    ads: [
      { type: 'header', position: 'top' },
      { type: 'content', position: 'bottom' }
    ]
  },
  {
    path: '/login',
    ads: [
      { type: 'header', position: 'top' },
      { type: 'content', position: 'middle' },
      { type: 'content', position: 'bottom' }
    ]
  },
  {
    path: '/email',
    ads: [
      { type: 'header', position: 'top' },
      { type: 'sidebar', position: 'left' },
      { type: 'sidebar', position: 'right' },
      { type: 'content', position: 'bottom' }
    ]
  }
];

export default function AdManager() {
  const location = useLocation();

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('Reklam yükleme hatası:', err);
    }
  }, [location.pathname]);

  const currentConfig = adConfigs.find(config => location.pathname.startsWith(config.path)) || adConfigs[0];

  return (
    <>
      {currentConfig.ads.map((ad, index) => (
        <div
          key={`${ad.type}-${ad.position}-${index}`}
          className={`${
            ad.position === 'top' ? 'w-full mb-8' :
            ad.position === 'bottom' ? 'w-full mt-8' :
            ad.position === 'middle' ? 'w-full my-8' :
            ad.position === 'left' ? 'hidden lg:block w-[300px] flex-shrink-0' :
            'hidden xl:block w-[300px] flex-shrink-0'
          }`}
        >
          {ad.position === 'left' || ad.position === 'right' ? (
            <div className="sticky top-8">
              <AdComponent type={ad.type} />
            </div>
          ) : (
            <AdComponent type={ad.type} />
          )}
        </div>
      ))}
    </>
  );
} 