import React from 'react';
import { Instagram, Heart } from 'lucide-react';
import { INSTAGRAM_POSTS, SOCIAL_LINKS } from '../constants';
import { Button } from '../components/ui';

const Social: React.FC = () => {
  return (
    <div className="pb-24 animate-fade-in bg-black min-h-screen">
      <div className="sticky top-0 bg-black/90 backdrop-blur-md z-10 p-5 border-b border-white/10 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Social</h1>
        <Instagram className="text-gold-500" />
      </div>

      <div className="p-5 text-center">
        <div className="inline-block p-1 rounded-full bg-gradient-to-tr from-yellow-400 to-yellow-700 mb-3">
          <div className="h-20 w-20 bg-black rounded-full p-1">
            <img src="https://picsum.photos/200" className="rounded-full w-full h-full object-cover" alt="Profile" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-white">{SOCIAL_LINKS.instagramHandle}</h2>
        <p className="text-gray-400 text-sm mb-4">Acompanhe nossas novidades e eventos exclusivos.</p>
        <Button
          onClick={() => window.open(SOCIAL_LINKS.instagram, '_blank')}
          variant="outline"
          className="h-10 py-0 text-sm max-w-[200px] mx-auto"
        >
          Seguir no Instagram
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-1 px-1">
        {INSTAGRAM_POSTS.map((post) => (
          <div key={post.id} className="relative aspect-square bg-gray-900 group overflow-hidden">
            <img src={post.url} alt="Post" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-xs gap-1">
              <span className="flex items-center gap-1"><Heart size={12} fill="white" /> {post.likes}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Social;