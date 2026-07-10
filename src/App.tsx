import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { Volume2, VolumeX } from "lucide-react";

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
    <div className="min-h-screen bg-rose-950 text-white font-sans selection:bg-gold-500 selection:text-burgundy-950">
      <audio ref={audioRef} src="media/sparks.mp3" loop preload="auto" />
      
      <div className="flex justify-end p-6">
        <button onClick={togglePlayAudio} className="text-gold-200">
          {isPlayingAudio ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>
      </div>

      <main className="flex flex-col items-center justify-center p-10 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-5xl font-serif mb-4">Yara & Ahmed</h1>
          <p className="text-xl italic">We invite you to celebrate our special day.</p>
        </motion.div>

        <section className="mt-12 p-6 bg-burgundy-900 rounded-lg max-w-md w-full">
          <h2 className="text-2xl font-serif mb-4">RSVP</h2>
          <form className="space-y-4 text-left">
            <div>
              <label className="block text-sm mb-1">Name</label>
              <input type="text" className="w-full p-2 bg-burgundy-950 border border-gold-500 rounded" />
            </div>
            <button type="button" className="w-full py-2 bg-gold-600 text-burgundy-950 font-bold rounded">
              Send RSVP
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
