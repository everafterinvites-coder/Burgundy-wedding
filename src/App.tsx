import React, { useState, useEffect, useRef } from "react";
import { 
  Heart, MapPin, Calendar, Clock, Image as ImageIcon, Sparkles, 
  Upload, Trash2, Shield, Eye, Download, LogIn, Lock, 
  Instagram, Check, RefreshCw, ChevronRight, Sparkle, 
  Volume2, VolumeX, Database 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { addRsvp, getRsvps, deleteRsvp, addPhoto, subscribeToPhotos, deletePhoto } from "./firebase";
import {
  isSupabaseConfigured, getSupabaseCredentials, saveSupabaseCredentials,
  clearSupabaseCredentials, testSupabaseConnection, syncRsvpToSupabase,
  syncPhotoToSupabase, deleteRsvpFromSupabase, deletePhotoFromSupabase,
  fetchSupabaseRsvps, fetchSupabasePhotos
} from "./supabase";

const SAMPLE_GALLERY = [
  { id: "sample-1", guestName: "Yara & Ahmed", caption: "Our Engagement Session in Cairo", photoUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80", createdAt: new Date().toISOString() },
  { id: "sample-2", guestName: "Nour & Karim", caption: "Can't wait to celebrate with you!", photoUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80", createdAt: new Date().toISOString() },
  { id: "sample-3", guestName: "Ever After Invites", caption: "Perfect day for a perfect couple", photoUrl: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80", createdAt: new Date().toISOString() }
];

export default function App() {
  const [curtainEnded, setCurtainEnded] = useState(false);
  const [skipCurtain, setSkipCurtain] = useState(false);
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
    <div className="min-h-screen bg-burgundy-950 text-burgundy-50 font-sans relative overflow-x-hidden selection:bg-gold-500 selection:text-burgundy-950">
      {/* Audio path updated to relative path to resolve 404 errors on GitHub Pages */}
      <audio ref={audioRef} src="media/sparks.mp3" loop preload="auto" />
      
      <div className="p-10 text-center">
        <h1>Yara & Ahmed</h1>
      </div>
    </div>
  );
}
