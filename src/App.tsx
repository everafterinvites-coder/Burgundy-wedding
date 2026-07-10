import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { Volume2, VolumeX, ChevronDown } from "lucide-react";

export default function App() {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(console.error);
    }
  };

  return (
    <div className="min-h-screen bg-rose-950 text-gold-100 font-serif overflow-x-hidden">
      <audio ref={audioRef} src="media/sparks.mp3" loop preload="auto" />
      
      {/* Hero Section */}
      <div className="h-screen flex flex-col items-center justify-center relative border-b border-gold-800/30">
        <button onClick={togglePlayAudio} className="absolute top-6 right-6 text-gold-500">
          {isPlayingAudio ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5 }}
          className="text-center"
        >
          <p className="text-gold-500 uppercase tracking-widest text-sm mb-4">The Celebration of Love</p>
          <h1 className="text-6xl md:text-8xl mb-6">Yara & Ahmed</h1>
          <p className="text-2xl italic font-serif">Are Getting Married</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-10"
        >
          <p className="text-sm uppercase tracking-widest text-gold-700">Scroll to discover</p>
          <ChevronDown className="mx-auto mt-2 text-gold-500 animate-bounce" />
        </motion.div>
      </div>

      {/* Placeholder for the next section */}
      <div className="p-10 text-center text-gold-500">
        [Add next section here]
      </div>
    </div>
  );
}
