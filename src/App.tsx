import React, { useState, useEffect, useRef } from "react";
import { 
  Heart, 
  MapPin, 
  Calendar, 
  Clock, 
  Image as ImageIcon, 
  Sparkles, 
  Upload, 
  Trash2, 
  Shield, 
  Eye, 
  Download, 
  LogIn, 
  Lock, 
  Instagram, 
  Check, 
  RefreshCw,
  ChevronRight,
  Sparkle,
  Volume2,
  VolumeX,
  Database
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  addRsvp, 
  getRsvps, 
  deleteRsvp, 
  addPhoto, 
  subscribeToPhotos, 
  deletePhoto 
} from "./firebase";
import {
  isSupabaseConfigured,
  getSupabaseCredentials,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
  testSupabaseConnection,
  syncRsvpToSupabase,
  syncPhotoToSupabase,
  deleteRsvpFromSupabase,
  deletePhotoFromSupabase,
  fetchSupabaseRsvps,
  fetchSupabasePhotos,
  SUPABASE_SQL_SCHEMA
} from "./supabase";

// High-resolution royal wedding preloaded images for gallery
const SAMPLE_GALLERY = [
  {
    id: "sample-1",
    guestName: "Yara & Ahmed",
    caption: "Our Engagement Session in Cairo",
    photoUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
    createdAt: new Date().toISOString()
  },
  {
    id: "sample-2",
    guestName: "Nour & Karim",
    caption: "Can't wait to celebrate with you!",
    photoUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
    createdAt: new Date().toISOString()
  },
  {
    id: "sample-3",
    guestName: "Ever After Invites",
    caption: "Perfect day for a perfect couple",
    photoUrl: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80",
    createdAt: new Date().toISOString()
  }
];

export default function App() {
  // State for Curtain Entrance
  const [curtainEnded, setCurtainEnded] = useState(false);
  const [skipCurtain, setSkipCurtain] = useState(false);
  
  // Audio state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Toggle background music play/pause
  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlayingAudio(true);
        })
        .catch((err) => {
          console.error("Audio play failed:", err);
        });
    }
  };

  // Autoplay audio once user clicks past curtains to enter
  useEffect(() => {
    const showMain = curtainEnded || skipCurtain;
    if (showMain && audioRef.current) {
      // Small timeout to ensure browser registers the click interaction perfectly
      const timer = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play()
            .then(() => {
              setIsPlayingAudio(true);
            })
            .catch((err) => {
              console.log("Autoplay was prevented by browser policy:", err);
              setIsPlayingAudio(false);
            });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [curtainEnded, skipCurtain]);

  // Scroll position to trigger fade-ins
  const [scrollProgress, setScrollProgress] = useState(0);

  // Countdown timer state
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // RSVP Form state
  const [rsvpForm, setRsvpForm] = useState({
    guestName: "",
    attending: true,
    dietary: "",
    guestsCount: 0,
    message: ""
  });
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);

  // Photobooth upload state
  const [uploaderName, setUploaderName] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Guest photo gallery state
  const [photosList, setPhotosList] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

  // Organizer state
  const [showOrganizer, setShowOrganizer] = useState(false);
  const [organizerPasscode, setOrganizerPasscode] = useState("");
  const [isOrganizerAuthed, setIsOrganizerAuthed] = useState(false);
  const [rsvpsList, setRsvpsList] = useState<any[]>([]);
  const [adminPhotosList, setAdminPhotosList] = useState<any[]>([]);
  const [organizerError, setOrganizerError] = useState("");

  // Supabase states
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const [isSupabaseActive, setIsSupabaseActive] = useState(false);
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState("");
  const [supabaseTestLoading, setSupabaseTestLoading] = useState(false);
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const [supabaseSyncing, setSupabaseSyncing] = useState(false);
  const [supabaseSyncError, setSupabaseSyncError] = useState("");
  const [supabaseSyncSuccess, setSupabaseSyncSuccess] = useState("");
  const [currentBackend, setCurrentBackend] = useState<"firebase" | "supabase">("firebase");

  // Load Supabase credentials on start
  useEffect(() => {
    const creds = getSupabaseCredentials();
    setSupabaseUrl(creds.url);
    setSupabaseAnonKey(creds.key);
    setIsSupabaseActive(isSupabaseConfigured());
  }, []);

  // Track media errors for rendering fallback placeholders
  const [mediaErrors, setMediaErrors] = useState<Record<string, boolean>>({});

  const handleMediaError = (key: string) => {
    setMediaErrors((prev) => ({ ...prev, [key]: true }));
  };

  // 1. Countdown Logic to Sept 9, 2026
  useEffect(() => {
    const targetDate = new Date("2026-09-09T18:00:00+02:00").getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress(window.scrollY / totalHeight);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 3. Real-time photobooth listener (Firebase or Supabase polling)
  useEffect(() => {
    if (curtainEnded || skipCurtain) {
      if (currentBackend === "supabase" && isSupabaseActive) {
        // Fetch from Supabase
        const loadSupabasePhotos = async () => {
          try {
            const sPhotos = await fetchSupabasePhotos();
            if (sPhotos && sPhotos.length > 0) {
              setPhotosList(sPhotos);
              setAdminPhotosList(sPhotos);
            } else {
              setPhotosList(SAMPLE_GALLERY);
              setAdminPhotosList([]);
            }
          } catch (err) {
            console.error("Supabase photos load error", err);
            setPhotosList(SAMPLE_GALLERY);
          }
        };
        loadSupabasePhotos();
        const interval = setInterval(loadSupabasePhotos, 8000); // 8-second polling
        return () => clearInterval(interval);
      } else {
        const unsubscribe = subscribeToPhotos(
          (updatedPhotos) => {
            setPhotosList(updatedPhotos.length > 0 ? updatedPhotos : SAMPLE_GALLERY);
            setAdminPhotosList(updatedPhotos);
          },
          (err) => {
            console.error("Gallery subscription error", err);
            setPhotosList(SAMPLE_GALLERY);
          }
        );
        return () => unsubscribe();
      }
    }
  }, [curtainEnded, skipCurtain, currentBackend, isSupabaseActive]);

  // 4. RSVP submission handler
  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpForm.guestName.trim()) return;

    setRsvpSubmitting(true);
    try {
      const rsvpId = await addRsvp({
        guestName: rsvpForm.guestName,
        attending: rsvpForm.attending,
        dietary: rsvpForm.dietary,
        guestsCount: Number(rsvpForm.guestsCount),
        message: rsvpForm.message
      });

      // Synchronize with Supabase if active
      if (rsvpId && isSupabaseActive) {
        try {
          await syncRsvpToSupabase({
            id: rsvpId,
            guestName: rsvpForm.guestName,
            attending: rsvpForm.attending,
            dietary: rsvpForm.dietary,
            guestsCount: Number(rsvpForm.guestsCount),
            message: rsvpForm.message,
            createdAt: new Date().toISOString()
          });
        } catch (sErr) {
          console.error("Failed syncing RSVP to Supabase:", sErr);
        }
      }

      setRsvpSuccess(true);
      // Reset form
      setRsvpForm({
        guestName: "",
        attending: true,
        dietary: "",
        guestsCount: 0,
        message: ""
      });
    } catch (err) {
      console.error(err);
      alert("There was an error saving your RSVP. Please try again.");
    } finally {
      setRsvpSubmitting(false);
    }
  };

  // 5. Guest photobooth file handling (convert to base64 with compression)
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        // Compress using canvas to ensure it fits well inside the 1MB Firestore limit
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 600;
        const scale = MAX_WIDTH / img.width;
        
        if (img.width > MAX_WIDTH) {
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scale;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Output compressed jpeg base64
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
        setPhotoBase64(compressedBase64);
      };
    };
    reader.readAsDataURL(file);
  };

  // Submit Photo to guest gallery
  const handlePhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploaderName.trim() || !photoBase64) return;

    setIsUploadingPhoto(true);
    try {
      const photoId = await addPhoto({
        guestName: uploaderName,
        photoUrl: photoBase64,
        caption: photoCaption
      });

      // Synchronize with Supabase if active
      if (photoId && isSupabaseActive) {
        try {
          await syncPhotoToSupabase({
            id: photoId,
            guestName: uploaderName,
            photoUrl: photoBase64,
            caption: photoCaption,
            createdAt: new Date().toISOString()
          });
        } catch (sErr) {
          console.error("Failed syncing Photo to Supabase:", sErr);
        }
      }

      setUploadSuccess(true);
      setUploaderName("");
      setPhotoCaption("");
      setPhotoBase64(null);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Error uploading photo. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // 6. Organizer login & loading data
  const handleOrganizerAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (organizerPasscode === "everafter" || organizerPasscode === "yara_ahmed_wedding_2026") {
      setIsOrganizerAuthed(true);
      setOrganizerError("");
      loadOrganizerData();
    } else {
      setOrganizerError("Incorrect secret passcode. Please try again.");
    }
  };

  const loadOrganizerData = async () => {
    try {
      let rsvps: any[] = [];
      if (currentBackend === "supabase" && isSupabaseActive) {
        try {
          const sRsvps = await fetchSupabaseRsvps();
          if (sRsvps) {
            rsvps = sRsvps;
          } else {
            const fRsvps = await getRsvps();
            rsvps = fRsvps || [];
          }
        } catch (sErr) {
          console.error("Failed fetching rsvps from Supabase, falling back to Firebase:", sErr);
          const fRsvps = await getRsvps();
          rsvps = fRsvps || [];
        }
      } else {
        const fRsvps = await getRsvps();
        rsvps = fRsvps || [];
      }

      // Sort by date descending
      rsvps.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setRsvpsList(rsvps);
    } catch (err) {
      console.error(err);
    }
  };

  // Re-load organizer data when backend selection or auth state changes
  useEffect(() => {
    if (isOrganizerAuthed) {
      loadOrganizerData();
    }
  }, [currentBackend, isOrganizerAuthed, isSupabaseActive]);

  const handleAdminDeleteRsvp = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this RSVP?")) {
      try {
        await deleteRsvp(id);
      } catch (err) {
        console.error("Firebase RSVP delete error:", err);
      }

      if (isSupabaseActive) {
        try {
          await deleteRsvpFromSupabase(id);
        } catch (err) {
          console.error("Supabase RSVP delete error:", err);
        }
      }
      loadOrganizerData();
    }
  };

  const handleAdminDeletePhoto = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this photo from the gallery?")) {
      try {
        await deletePhoto(id);
      } catch (err) {
        console.error("Firebase photo delete error:", err);
      }

      if (isSupabaseActive) {
        try {
          await deletePhotoFromSupabase(id);
        } catch (err) {
          console.error("Supabase photo delete error:", err);
        }
      }
    }
  };

  // Handle saving and testing Supabase connection
  const handleSaveSupabaseSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupabaseTestLoading(true);
    setSupabaseStatusMsg("");
    
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      clearSupabaseCredentials();
      setIsSupabaseActive(false);
      setSupabaseStatusMsg("Supabase settings cleared. Using default Firestore backend.");
      setSupabaseTestLoading(false);
      setCurrentBackend("firebase");
      return;
    }

    try {
      const result = await testSupabaseConnection(supabaseUrl, supabaseAnonKey);
      if (result.success) {
        saveSupabaseCredentials(supabaseUrl, supabaseAnonKey);
        setIsSupabaseActive(true);
        setSupabaseStatusMsg("Successfully connected to Supabase!");
      } else {
        setSupabaseStatusMsg(`Connection failed: ${result.error || "Please verify your credentials and make sure the 'rsvps' table exists, or click the schema view to create it."}`);
      }
    } catch (err) {
      setSupabaseStatusMsg(`Connection error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSupabaseTestLoading(false);
    }
  };

  // Synchronize all existing database records to Supabase
  const handleSyncAllData = async () => {
    if (!isSupabaseActive) {
      setSupabaseSyncError("Please configure and connect Supabase first.");
      return;
    }
    setSupabaseSyncing(true);
    setSupabaseSyncError("");
    setSupabaseSyncSuccess("");

    try {
      // 1. Fetch latest from Firebase
      const latestRsvps = (await getRsvps() || []) as any[];
      
      // Sync RSVPs
      let syncedRsvpsCount = 0;
      for (const rsvp of latestRsvps) {
        await syncRsvpToSupabase({
          id: rsvp.id,
          guestName: rsvp.guestName,
          attending: rsvp.attending,
          dietary: rsvp.dietary || "",
          guestsCount: Number(rsvp.guestsCount || 0),
          message: rsvp.message || "",
          createdAt: rsvp.createdAt || new Date().toISOString()
        });
        syncedRsvpsCount++;
      }

      // Sync Photos
      let syncedPhotosCount = 0;
      for (const photo of adminPhotosList) {
        await syncPhotoToSupabase({
          id: photo.id,
          guestName: photo.guestName,
          photoUrl: photo.photoUrl,
          caption: photo.caption || "",
          createdAt: photo.createdAt || new Date().toISOString()
        });
        syncedPhotosCount++;
      }

      setSupabaseSyncSuccess(`Successfully synchronized ${syncedRsvpsCount} RSVPs and ${syncedPhotosCount} photos to Supabase!`);
      await loadOrganizerData();
    } catch (err) {
      setSupabaseSyncError(`Synchronization failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSupabaseSyncing(false);
    }
  };

  const exportRsvpsToCSV = () => {
    if (rsvpsList.length === 0) return;
    
    const headers = ["Guest Name", "Attending", "Dietary Needs", "Extra Guests", "Message", "Submission Date"];
    const rows = rsvpsList.map(r => [
      `"${r.guestName.replace(/"/g, '""')}"`,
      r.attending ? "Yes" : "No",
      `"${(r.dietary || "").replace(/"/g, '""')}"`,
      r.guestsCount,
      `"${(r.message || "").replace(/"/g, '""')}"`,
      new Date(r.createdAt).toLocaleString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Yara_Ahmed_Wedding_RSVPs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to test if a file path is a video based on extension
  const isVideoFile = (url: string) => {
    const trimmed = url.toLowerCase().split('?')[0];
    return trimmed.endsWith(".mp4") || trimmed.endsWith(".webm") || trimmed.endsWith(".mov");
  };

  const showMainSite = curtainEnded || skipCurtain;

  return (
    <div className="min-h-screen bg-burgundy-950 text-burgundy-50 font-sans relative overflow-x-hidden selection:bg-gold-500 selection:text-burgundy-950">
      
      {/* Background Wedding Music - Sparks */}
      <audio
        ref={audioRef}
        src="/media/sparks.mp3"
        loop
        preload="auto"
      />

      {/* ----------------- CURTAINS INTRO ----------------- */}
      <AnimatePresence>
        {!showMainSite && (
          <motion.div 
            key="curtains-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            onClick={() => setSkipCurtain(true)}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-burgundy-950 overflow-hidden cursor-pointer"
            title="Click anywhere to enter"
          >
            {/* The Curtains Video or Backdrop */}
            <div className="absolute inset-0 w-full h-full object-cover">
              {!mediaErrors["curtains"] ? (
                isVideoFile("/media/curtains.MOV") ? (
                  <video 
                    src="/media/curtains.MOV" 
                    autoPlay 
                    muted 
                    playsInline
                    onEnded={() => setCurtainEnded(true)}
                    onError={() => handleMediaError("curtains")}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img 
                    src="/media/curtains.MOV" 
                    alt="Wedding Curtains"
                    onError={() => handleMediaError("curtains")}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )
              ) : (
                /* Pure gorgeous CSS velvet curtain fallback */
                <div className="absolute inset-0 bg-gradient-to-r from-burgundy-950 via-burgundy-800 to-burgundy-950 flex justify-between opacity-95">
                  <div className="w-1/2 h-full border-r border-gold-300/30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-burgundy-800/20 via-transparent to-transparent shadow-2xl" />
                  <div className="w-1/2 h-full border-l border-gold-300/30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-burgundy-800/20 via-transparent to-transparent shadow-2xl" />
                </div>
              )}
              {/* Luxury dark vignetting */}
              <div className="absolute inset-0 bg-radial-gradient from-transparent via-burgundy-950/70 to-burgundy-950/95 pointer-events-none" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------- MAIN SITE ----------------- */}
      {showMainSite && (
        <div className="relative">
          
          {/* Quick Organizer Portal Lock Button */}
          <button 
            onClick={() => setShowOrganizer(!showOrganizer)}
            className="fixed top-6 right-6 z-40 bg-burgundy-900/80 border border-gold-400/40 hover:border-gold-300 p-2.5 rounded-full backdrop-blur-md text-gold-300 transition-all shadow-lg hover:shadow-gold-500/10"
            title="Organizer Dashboard"
          >
            <Lock className="w-4 h-4" />
          </button>

          {/* Background Music Toggle Button */}
          <button 
            onClick={togglePlayAudio}
            className="fixed top-6 right-18 z-40 bg-burgundy-900/80 border border-gold-400/40 hover:border-gold-300 p-2.5 rounded-full backdrop-blur-md text-gold-300 transition-all shadow-lg hover:shadow-gold-500/10 flex items-center justify-center cursor-pointer"
            title={isPlayingAudio ? "Mute Background Music" : "Play Background Music"}
          >
            {isPlayingAudio ? (
              <div className="relative w-4 h-4 flex items-center justify-center">
                <span className="absolute inline-flex h-full w-full rounded-full bg-gold-400/20 animate-ping" />
                <Volume2 className="w-4 h-4 relative z-10 text-gold-400 animate-[pulse_1.5s_infinite]" />
              </div>
            ) : (
              <VolumeX className="w-4 h-4 text-gold-400/60" />
            )}
          </button>

          {/* ----------------- ORGANIZER VIEW MODAL ----------------- */}
          <AnimatePresence>
            {showOrganizer && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-burgundy-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
              >
                <motion.div 
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  className="bg-burgundy-900 border border-gold-400/40 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col my-8"
                >
                  {/* Modal Header */}
                  <div className="px-6 py-4 bg-burgundy-950 border-b border-gold-400/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-gold-400" />
                      <h3 className="font-serif-lux font-semibold text-gold-200 tracking-wider">ORGANIZER PORTAL</h3>
                    </div>
                    <button 
                      onClick={() => setShowOrganizer(false)}
                      className="text-xs text-gold-300/80 hover:text-white border border-gold-400/30 px-3 py-1 rounded-full hover:bg-gold-400/10 transition-all"
                    >
                      Close Dashboard
                    </button>
                  </div>

                  {/* Auth Panel */}
                  {!isOrganizerAuthed ? (
                    <form onSubmit={handleOrganizerAuth} className="p-8 max-w-md mx-auto text-center space-y-6 my-12">
                      <div className="w-12 h-12 rounded-full border border-gold-300/30 bg-burgundy-950 flex items-center justify-center mx-auto text-gold-400">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="font-serif-lux text-xl text-gold-200 tracking-wide">Yara & Ahmed's Dashboard</h4>
                        <p className="text-xs text-burgundy-200">Enter the wedding passcode to view RSVP lists and guest photo uploads.</p>
                      </div>
                      <div className="space-y-2">
                        <input 
                          type="password"
                          placeholder="Secret Passcode"
                          value={organizerPasscode}
                          onChange={(e) => setOrganizerPasscode(e.target.value)}
                          className="w-full bg-burgundy-950 border border-gold-400/30 rounded-xl px-4 py-2.5 text-center text-sm focus:outline-none focus:ring-1 focus:ring-gold-400 text-gold-200"
                        />
                        {organizerError && <p className="text-[11px] text-rose-400">{organizerError}</p>}
                      </div>
                      <button 
                        type="submit"
                        className="w-full py-2.5 bg-gold-400 hover:bg-gold-300 text-burgundy-950 font-bold rounded-xl text-xs tracking-wider transition-colors"
                      >
                        AUTHORIZE
                      </button>
                    </form>
                  ) : (
                    /* Dashboard Panel */
                    <div className="p-6 md:p-8 space-y-8 overflow-y-auto max-h-[80vh]">
                      
                      {/* Stats counters */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-burgundy-950 border border-gold-400/10 p-5 rounded-xl space-y-1">
                          <span className="text-[10px] text-gold-400 tracking-widest block uppercase">Total RSVP Submissions</span>
                          <span className="text-3xl font-serif-lux font-bold text-white">{rsvpsList.length}</span>
                        </div>
                        <div className="bg-burgundy-950 border border-gold-400/10 p-5 rounded-xl space-y-1">
                          <span className="text-[10px] text-gold-400 tracking-widest block uppercase">Attending Guests</span>
                          <span className="text-3xl font-serif-lux font-bold text-emerald-400">
                            {rsvpsList.filter(r => r.attending).reduce((acc, r) => acc + 1 + (r.guestsCount || 0), 0)}
                          </span>
                        </div>
                        <div className="bg-burgundy-950 border border-gold-400/10 p-5 rounded-xl space-y-1">
                          <span className="text-[10px] text-gold-400 tracking-widest block uppercase">Declined Invitation</span>
                          <span className="text-3xl font-serif-lux font-bold text-rose-400">
                            {rsvpsList.filter(r => !r.attending).length}
                          </span>
                        </div>
                      </div>

                      {/* Supabase Integration & Database Hub */}
                      <div className="bg-burgundy-950/60 border border-gold-400/20 rounded-xl p-5 md:p-6 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gold-400/10">
                          <div className="space-y-1">
                            <h4 className="font-serif-lux text-base text-gold-200 tracking-wide flex items-center gap-2">
                              <Database className="w-4 h-4 text-gold-400" />
                              Database Configuration & Integrations
                            </h4>
                            <p className="text-xs text-burgundy-200">
                              Choose your active database backend and sync data in real-time.
                            </p>
                          </div>
                          
                          {/* Backend Toggler */}
                          <div className="flex items-center gap-1.5 bg-burgundy-900/60 p-1 rounded-lg border border-gold-400/20">
                            <button
                              onClick={() => setCurrentBackend("firebase")}
                              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                currentBackend === "firebase"
                                  ? "bg-gold-400 text-burgundy-950 shadow-sm font-semibold"
                                  : "text-gold-300/70 hover:text-white hover:bg-gold-400/5"
                              }`}
                            >
                              Firebase (Default)
                            </button>
                            <button
                              onClick={() => {
                                if (!isSupabaseActive) {
                                  alert("Please configure and connect your Supabase database first below.");
                                  return;
                                }
                                setCurrentBackend("supabase");
                              }}
                              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                currentBackend === "supabase"
                                  ? "bg-gold-400 text-burgundy-950 shadow-sm font-semibold"
                                  : "text-gold-300/70 hover:text-white hover:bg-gold-400/5"
                              } ${!isSupabaseActive ? "opacity-50 cursor-not-allowed" : ""}`}
                              title={!isSupabaseActive ? "Configure Supabase below to activate" : "Use Supabase backend"}
                            >
                              Supabase {isSupabaseActive && <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full ml-1" />}
                            </button>
                          </div>
                        </div>

                        {/* Config Form and SQL Schema */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                          {/* Credentials configuration */}
                          <form onSubmit={handleSaveSupabaseSettings} className="lg:col-span-7 space-y-4">
                            <div className="space-y-1">
                              <label className="text-[10px] text-gold-300 tracking-wider uppercase block">Supabase Project URL</label>
                              <input
                                type="text"
                                placeholder="https://your-project.supabase.co"
                                value={supabaseUrl}
                                onChange={(e) => setSupabaseUrl(e.target.value)}
                                className="w-full bg-burgundy-900 border border-gold-400/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gold-400 text-gold-200 font-mono"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-[10px] text-gold-300 tracking-wider uppercase block">Supabase Anon/Public Key</label>
                              <input
                                type="password"
                                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                value={supabaseAnonKey}
                                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                                className="w-full bg-burgundy-900 border border-gold-400/20 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-gold-400 text-gold-200 font-mono"
                              />
                            </div>

                            {supabaseStatusMsg && (
                              <p className={`text-xs ${supabaseStatusMsg.includes("Successfully") ? "text-emerald-400" : "text-rose-400"}`}>
                                {supabaseStatusMsg}
                              </p>
                            )}

                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={supabaseTestLoading}
                                className="flex-1 py-2 bg-gold-400 hover:bg-gold-300 disabled:bg-gold-400/40 text-burgundy-950 font-bold rounded-lg text-xs tracking-wider transition-colors"
                              >
                                {supabaseTestLoading ? "TESTING CONNECTION..." : isSupabaseActive ? "UPDATE CONFIGURATION" : "CONNECT & SAVE SUPABASE"}
                              </button>
                              {isSupabaseActive && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    clearSupabaseCredentials();
                                    setSupabaseUrl("");
                                    setSupabaseAnonKey("");
                                    setIsSupabaseActive(false);
                                    setSupabaseStatusMsg("Supabase settings cleared.");
                                    setCurrentBackend("firebase");
                                  }}
                                  className="px-3 py-2 border border-rose-500/30 hover:border-rose-500 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 hover:text-white rounded-lg text-xs font-semibold transition-all"
                                >
                                  Disconnect
                                </button>
                              )}
                            </div>
                          </form>

                          {/* Database action & SQL helper column */}
                          <div className="lg:col-span-5 flex flex-col justify-between bg-burgundy-900/40 border border-gold-400/10 p-4 rounded-xl space-y-4">
                            <div className="space-y-2">
                              <h5 className="text-xs text-gold-300 font-medium tracking-wide uppercase">Database Synchronizer</h5>
                              <p className="text-[11px] text-burgundy-200 leading-relaxed">
                                Seamlessly synchronize all RSVP submissions and gallery photo uploads from your main Firestore database into your connected Supabase instance.
                              </p>
                            </div>

                            {/* Sync Buttons and Statuses */}
                            <div className="space-y-2">
                              <button
                                type="button"
                                onClick={handleSyncAllData}
                                disabled={supabaseSyncing || !isSupabaseActive}
                                className={`w-full py-2 flex items-center justify-center gap-1.5 bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-burgundy-950 font-bold rounded-lg text-xs tracking-wide transition-all shadow-md ${
                                  (!isSupabaseActive || supabaseSyncing) ? "opacity-40 cursor-not-allowed" : "active:scale-[0.98]"
                                }`}
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${supabaseSyncing ? "animate-spin" : ""}`} />
                                {supabaseSyncing ? "SYNCHRONIZING..." : "SYNC FIRESTORE TO SUPABASE"}
                              </button>

                              {supabaseSyncError && (
                                <p className="text-[10px] text-rose-400 text-center">{supabaseSyncError}</p>
                              )}
                              {supabaseSyncSuccess && (
                                <p className="text-[10px] text-emerald-400 text-center font-medium">{supabaseSyncSuccess}</p>
                              )}
                            </div>

                            {/* Schema toggler button */}
                            <button
                              type="button"
                              onClick={() => setShowSqlSchema(!showSqlSchema)}
                              className="w-full py-1.5 border border-gold-400/20 hover:border-gold-400/40 text-gold-300 hover:text-white rounded-lg text-[11px] font-medium transition-all"
                            >
                              {showSqlSchema ? "Hide SQL Setup Snippet" : "View Supabase SQL Schema"}
                            </button>
                          </div>
                        </div>

                        {/* SQL Code Box Accordion */}
                        {showSqlSchema && (
                          <div className="bg-burgundy-950/80 border border-gold-400/10 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-gold-400/10">
                              <span className="text-xs text-gold-300 font-semibold tracking-wide">SUPABASE SQL SCHEMA SETUP</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
                                  alert("SQL snippet copied to clipboard! Paste it into your Supabase SQL Editor and run it.");
                                }}
                                className="text-[10px] bg-gold-400 hover:bg-gold-300 text-burgundy-950 px-2 py-1 rounded font-bold transition-colors"
                              >
                                COPY SQL CODE
                              </button>
                            </div>
                            <p className="text-[11px] text-burgundy-200">
                              Run this schema block inside your Supabase project's <strong className="text-gold-200">SQL Editor</strong> to create the <code>rsvps</code> and <code>photos</code> tables and configure the required row-level security (RLS) public read and write policies!
                            </p>
                            <pre className="p-3 bg-black/50 border border-gold-400/5 rounded-lg text-[10px] text-emerald-300/90 font-mono overflow-x-auto max-h-[160px] overflow-y-auto leading-relaxed select-all">
                              {SUPABASE_SQL_SCHEMA}
                            </pre>
                          </div>
                        )}
                      </div>

                      {/* RSVPs Table list */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <h4 className="font-serif-lux text-lg text-gold-200 tracking-wide">Guest Attendance RSVPs</h4>
                            <p className="text-xs text-burgundy-200">List of all submissions updated in real-time.</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={loadOrganizerData}
                              className="p-2 border border-gold-400/20 rounded-lg hover:bg-gold-400/10 text-gold-400 transition-colors"
                              title="Refresh list"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={exportRsvpsToCSV}
                              className="flex items-center gap-1.5 px-3 py-2 bg-gold-400 hover:bg-gold-300 text-burgundy-950 rounded-lg text-xs font-bold transition-all shadow-sm"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Export CSV
                            </button>
                          </div>
                        </div>

                        <div className="border border-gold-400/10 rounded-xl overflow-hidden bg-burgundy-950">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-gold-400/10 text-[10px] uppercase text-gold-400 tracking-wider">
                                  <th className="px-4 py-3">Guest Name</th>
                                  <th className="px-4 py-3">Attending</th>
                                  <th className="px-4 py-3">Dietary Needs</th>
                                  <th className="px-4 py-3 text-center">Guests</th>
                                  <th className="px-4 py-3">Message</th>
                                  <th className="px-4 py-3">Date</th>
                                  <th className="px-4 py-3 text-center">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gold-400/5 text-xs text-burgundy-100">
                                {rsvpsList.length === 0 ? (
                                  <tr>
                                    <td colSpan={7} className="text-center py-8 text-burgundy-300 italic">No RSVPs received yet.</td>
                                  </tr>
                                ) : (
                                  rsvpsList.map((rsvp) => (
                                    <tr key={rsvp.id} className="hover:bg-burgundy-900/40">
                                      <td className="px-4 py-3.5 font-medium text-white">{rsvp.guestName}</td>
                                      <td className="px-4 py-3.5">
                                        {rsvp.attending ? (
                                          <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">YES</span>
                                        ) : (
                                          <span className="bg-rose-950/80 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">NO</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3.5 max-w-[120px] truncate" title={rsvp.dietary}>{rsvp.dietary || "-"}</td>
                                      <td className="px-4 py-3.5 text-center">{rsvp.guestsCount || 0}</td>
                                      <td className="px-4 py-3.5 max-w-[180px] truncate" title={rsvp.message}>{rsvp.message || "-"}</td>
                                      <td className="px-4 py-3.5 font-mono text-[10px] opacity-80">{new Date(rsvp.createdAt).toLocaleDateString()}</td>
                                      <td className="px-4 py-3.5 text-center">
                                        <button 
                                          onClick={() => handleAdminDeleteRsvp(rsvp.id)}
                                          className="text-burgundy-300 hover:text-rose-400 p-1 rounded hover:bg-rose-950/35 transition-colors"
                                          title="Delete RSVP"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Guest Shared Photos Moderation */}
                      <div className="space-y-4 pt-4 border-t border-gold-400/10">
                        <div className="space-y-0.5">
                          <h4 className="font-serif-lux text-lg text-gold-200 tracking-wide">Gallery Moderation</h4>
                          <p className="text-xs text-burgundy-200">Remove inappropriate photos uploaded by guests.</p>
                        </div>

                        {adminPhotosList.length === 0 ? (
                          <div className="text-center p-6 bg-burgundy-950/40 border border-dashed border-gold-400/10 rounded-xl text-burgundy-300 italic text-xs">
                            No custom photos uploaded by guests yet.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {adminPhotosList.map((photo) => (
                              <div key={photo.id} className="relative group border border-gold-400/10 rounded-lg overflow-hidden bg-burgundy-950">
                                <img src={photo.photoUrl} alt={photo.caption} className="aspect-video w-full object-cover" referrerPolicy="no-referrer" />
                                <div className="p-2 space-y-0.5 text-[10px]">
                                  <span className="text-white block font-medium truncate">{photo.guestName}</span>
                                  <span className="text-burgundy-300 block truncate italic">"{photo.caption || "No caption"}"</span>
                                </div>
                                <button 
                                  onClick={() => handleAdminDeletePhoto(photo.id)}
                                  className="absolute top-2 right-2 p-1.5 bg-burgundy-950/80 rounded-full hover:bg-rose-600 text-gold-300 hover:text-white transition-colors"
                                  title="Delete photo"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ----------------- SECTION 1: CHANDELIER HERO ----------------- */}
          <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden bg-burgundy-950">
            {/* Chandelier Video/Image Background */}
            <div className="absolute inset-0 z-0 bg-burgundy-950">
              {!mediaErrors["chandelier"] ? (
                isVideoFile("/media/chandelier.MOV") ? (
                  <video 
                    src="/media/chandelier.MOV" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    onError={() => handleMediaError("chandelier")}
                    className="w-full h-full object-contain opacity-100"
                  />
                ) : (
                  <img 
                    src="/media/chandelier.MOV" 
                    alt="Luxury Chandelier Background"
                    onError={() => handleMediaError("chandelier")}
                    className="w-full h-full object-contain opacity-100"
                    referrerPolicy="no-referrer"
                  />
                )
              ) : (
                /* Pure Luxury Chandelier Fallback Animation/Design */
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-burgundy-900 via-burgundy-950 to-burgundy-950 flex flex-col items-center justify-start pt-24 opacity-90">
                  {/* Dynamic styled CSS Chandelier chandelier */}
                  <motion.div 
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                    className="w-32 h-32 flex flex-col items-center relative opacity-20"
                  >
                    <div className="w-1 h-20 bg-gradient-to-b from-transparent via-gold-400 to-gold-300" />
                    <div className="w-16 h-1 bg-gold-300 rounded-full" />
                    <div className="flex gap-4 -mt-0.5">
                      <span className="w-2 h-4 bg-gold-400 rounded-full animate-ping" />
                      <span className="w-2 h-4 bg-gold-400 rounded-full" />
                      <span className="w-2 h-4 bg-gold-400 rounded-full animate-ping" />
                    </div>
                  </motion.div>
                </div>
              )}
              {/* Overlay shading specifically covering the lower/burgundy parts matching plan.png layout */}
              <div className="absolute inset-0 bg-gradient-to-t from-burgundy-950 via-burgundy-950/40 to-transparent" />
            </div>



            {/* Chandelier Text Overlay - "Yara and Ahmed are getting married" */}
            <div className="relative z-10 max-w-[280px] xs:max-w-[320px] sm:max-w-[420px] md:max-w-[480px] w-full mx-auto space-y-6 pt-32 px-4">

              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-center gap-2 text-gold-300 text-[10px] sm:text-xs tracking-[0.2em] uppercase">
                  <Sparkle className="w-2.5 h-2.5 fill-gold-400 text-gold-400 shrink-0" />
                  <span className="truncate">THE CELEBRATION OF LOVE</span>
                  <Sparkle className="w-2.5 h-2.5 fill-gold-400 text-gold-400 shrink-0" />
                </div>

                {/* Elegant White typography exactly over the burgundy part */}
                <h1 className="font-serif-lux text-3xl sm:text-4xl md:text-5xl text-white tracking-wide leading-tight drop-shadow-md">
                  Yara <span className="text-gold-200 font-serif-lux italic">&</span> Ahmed
                </h1>
                
                <h3 className="font-serif-lux text-sm sm:text-base md:text-lg text-gold-100 tracking-[0.15em] font-light mt-4 drop-shadow">
                  ARE GETTING MARRIED
                </h3>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 1 }}
                className="pt-16 flex flex-col items-center gap-2 text-gold-300/60 font-serif-lux tracking-[0.15em] text-xs"
              >
                <span>SCROLL TO DISCOVER</span>
                <motion.div 
                  animate={{ y: [0, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-1 h-6 bg-gradient-to-b from-gold-400 to-transparent rounded-full"
                />
              </motion.div>
            </div>
          </section>

          {/* ----------------- SECTION 2: SAVE THE DATE (LACE ON RIGHT) ----------------- */}
          <section id="save-the-date" className="relative min-h-screen flex items-center bg-burgundy-900 overflow-hidden py-20 px-6 md:px-16">
            
            {/* Right Lace Asset Column - Placed directly as child of relative section for perfect corner alignment */}
            <div className="absolute top-0 right-0 z-0 pointer-events-none">
              {!mediaErrors["lace"] ? (
                <img 
                  src="/media/lace.png" 
                  alt="Elegant Lace Detail"
                  onError={() => handleMediaError("lace")}
                  className="w-32 sm:w-44 md:w-56 lg:w-64 h-auto object-contain object-top object-right opacity-95 block"
                  referrerPolicy="no-referrer"
                />
              ) : (
                /* Elegant lace placeholder */
                <div className="w-32 h-32 bg-burgundy-950/40 flex items-center justify-center p-4 text-center border-l border-b border-gold-400/20 rounded-bl-2xl">
                  <div className="space-y-2">
                    <span className="text-[8px] text-gold-400 tracking-widest block uppercase">Lace Panel</span>
                  </div>
                </div>
              )}
            </div>

            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Content Column */}
              <div className="lg:col-span-7 space-y-8 relative z-10 text-center lg:text-left">
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1 }}
                  className="space-y-4"
                >
                  <span className="text-xs text-gold-400 tracking-[0.2em] uppercase font-semibold">SEPTEMBER 9, 2026</span>
                  <h2 className="font-serif-lux text-4xl md:text-6xl text-white tracking-wide">
                    Save The Date
                  </h2>
                  <div className="h-[1px] w-20 bg-gold-400 mx-auto lg:mx-0 my-4" />
                  <p className="text-burgundy-100 text-sm md:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
                    Kindly mark your calendars and join us for an evening filled with laughter, love, and dance as we embark on our journey together forever.
                  </p>
                </motion.div>

                {/* COUNTDOWN TIMER WIDGET */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 1 }}
                  className="grid grid-cols-4 gap-2 md:gap-4 max-w-md mx-auto lg:mx-0 bg-burgundy-950/60 backdrop-blur-md border border-gold-400/20 p-5 rounded-2xl shadow-xl"
                >
                  <div className="text-center">
                    <span className="font-serif-lux text-3xl md:text-4xl font-bold text-gold-300 block">{countdown.days}</span>
                    <span className="text-[9px] md:text-[10px] text-burgundy-200 uppercase tracking-widest">Days</span>
                  </div>
                  <div className="text-center">
                    <span className="font-serif-lux text-3xl md:text-4xl font-bold text-gold-300 block">{countdown.hours}</span>
                    <span className="text-[9px] md:text-[10px] text-burgundy-200 uppercase tracking-widest">Hours</span>
                  </div>
                  <div className="text-center">
                    <span className="font-serif-lux text-3xl md:text-4xl font-bold text-gold-300 block">{countdown.minutes}</span>
                    <span className="text-[9px] md:text-[10px] text-burgundy-200 uppercase tracking-widest">Mins</span>
                  </div>
                  <div className="text-center">
                    <span className="font-serif-lux text-3xl md:text-4xl font-bold text-gold-300 block">{countdown.seconds}</span>
                    <span className="text-[9px] md:text-[10px] text-burgundy-200 uppercase tracking-widest">Secs</span>
                  </div>
                </motion.div>
              </div>

            </div>
          </section>

          {/* ----------------- SECTION 3: OUR STORY (FLOWERS ON BOTTOM LEFT) ----------------- */}
          <section id="our-story" className="relative min-h-screen flex items-center bg-burgundy-950 overflow-hidden py-24 px-6 md:px-16">
            
            {/* Flowers decoration overlay on bottom left */}
            <div className="absolute bottom-0 left-0 w-80 md:w-96 z-0 pointer-events-none opacity-80">
              {!mediaErrors["flowers"] ? (
                <img 
                  src="/media/flowers.png" 
                  alt="Floral decoration"
                  onError={() => handleMediaError("flowers")}
                  className="w-full h-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                /* Fallback vector style flowers styling using CSS in left corner */
                <div className="absolute bottom-0 left-0 p-8 text-[11px] text-gold-400/40 select-none font-serif-lux">
                  🌹 Upload '/media/flowers.png'
                </div>
              )}
            </div>

            <div className="max-w-2xl mx-auto w-full relative z-10 text-center space-y-8">

              <div className="space-y-6">
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1 }}
                  className="space-y-4"
                >
                  <span className="text-xs text-gold-400 tracking-[0.2em] uppercase font-semibold">OUR JOURNEY</span>
                  <h2 className="font-serif-lux text-4xl md:text-6xl text-white tracking-wide">
                    Our Story
                  </h2>
                  <div className="h-[1px] w-20 bg-gold-400 mx-auto my-4" />
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 1 }}
                  className="space-y-4 text-burgundy-100/90 text-sm md:text-base leading-relaxed font-light"
                >
                  <p>
                    Yara and Ahmed's paths first crossed beneath the warm, sunlit canopies of Cairo. What began as a simple conversation over coffee quickly blossomed into an inseparable connection, bound by shared dreams, endless laughter, and a profound understanding of each other's souls.
                  </p>
                  <p>
                    Through long strolls along the majestic Nile, family gatherings, and support during life's seasons, they realized they had found their home in one another. Today, they stand ready to pledge a lifetime of devotion and invite you to witness the beginning of their forever.
                  </p>
                </motion.div>
              </div>

            </div>
          </section>

          {/* ----------------- SECTION 4: EVENT DETAILS (GOOSE ON BOTTOM RIGHT) ----------------- */}
          <section id="event-details" className="relative min-h-screen flex items-center bg-burgundy-900 overflow-hidden py-24 px-6 md:px-16">
            


            <div className="max-w-6xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Text Event details */}
              <div className="space-y-8 text-center lg:text-left">
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1 }}
                  className="space-y-4"
                >
                  <span className="text-xs text-gold-400 tracking-[0.2em] uppercase font-semibold">WHERE & WHEN</span>
                  <h2 className="font-serif-lux text-4xl md:text-6xl text-white tracking-wide">
                    Event Details
                  </h2>
                  <div className="h-[1px] w-20 bg-gold-400 mx-auto lg:mx-0 my-4" />
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 1 }}
                  className="space-y-6 text-sm"
                >
                  <div className="flex flex-col md:flex-row items-center gap-4 bg-burgundy-950/40 border border-gold-400/10 p-5 rounded-2xl">
                    <div className="p-3 bg-burgundy-900 border border-gold-400/20 text-gold-400 rounded-xl">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 md:text-left">
                      <h4 className="font-serif-lux text-lg text-gold-200">The Wedding Date</h4>
                      <p className="text-burgundy-100">Wednesday, September 9, 2026</p>
                      <p className="text-xs text-burgundy-300">Gates open at 5:00 PM | Ceremony begins at 6:00 PM</p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-4 bg-burgundy-950/40 border border-gold-400/10 p-5 rounded-2xl">
                    <div className="p-3 bg-burgundy-900 border border-gold-400/20 text-gold-400 rounded-xl">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 md:text-left">
                      <h4 className="font-serif-lux text-lg text-gold-200">The Royal Hall, Cairo</h4>
                      <p className="text-burgundy-100">The Baron Palace Grand Lawn & Hall, Heliopolis, Egypt</p>
                      <p className="text-xs text-burgundy-300">Heliopolis Palace District, Cairo Governor, Egypt</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Google Maps Embed and Actions */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="space-y-4"
              >
                <div className="border border-gold-400/20 rounded-2xl overflow-hidden shadow-2xl bg-burgundy-950 h-72">
                  <iframe 
                    title="Google Maps Venue Location"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3452.339794301646!2d31.33005822535496!3d30.086431974903332!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14583e2e02df35ef%3A0xc66c1b3f9bfbe1bb!2sBaron%20Empain%20Palace!5e0!3m2!1sen!2seg!4v1700000000000!5m2!1sen!2seg"
                    width="100%" 
                    height="100%" 
                    style={{ border: 0, filter: "contrast(1.1) brightness(0.9)" }} 
                    allowFullScreen={true} 
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                
                <a 
                  href="https://maps.app.goo.gl/9TqNfE8uYy6T8gYn7" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-burgundy-950 font-bold rounded-xl text-center flex items-center justify-center gap-2 text-xs tracking-wider transition-all shadow-md cursor-pointer"
                >
                  <MapPin className="w-4 h-4" />
                  GET DIRECTIONS ON GOOGLE MAPS
                </a>
              </motion.div>

            </div>
          </section>

          {/* ----------------- SECTION 5: CELEBRATION SCHEDULE (FAN ON BOTTOM RIGHT) ----------------- */}
          <section id="schedule" className="relative min-h-screen flex items-center bg-burgundy-950 overflow-hidden py-24 px-6 md:px-16">
            
            {/* Fan decoration overlay on bottom right */}
            <div className="absolute bottom-0 right-0 w-80 md:w-96 z-0 pointer-events-none opacity-80">
              {!mediaErrors["fan"] ? (
                <img 
                  src="/media/fan.png" 
                  alt="Fan decorations"
                  onError={() => handleMediaError("fan")}
                  className="w-full h-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                /* Fallback fan text */
                <div className="absolute bottom-0 right-0 p-8 text-[11px] text-gold-400/40 select-none font-serif-lux">
                  🪭 Upload '/media/fan.png'
                </div>
              )}
            </div>

            <div className="max-w-5xl mx-auto w-full relative z-10 space-y-12">
              
              <div className="text-center space-y-4">
                <span className="text-xs text-gold-400 tracking-[0.2em] uppercase font-semibold">THE CELEBRATION FLOW</span>
                <h2 className="font-serif-lux text-4xl md:text-6xl text-white tracking-wide">
                  Celebration Schedule
                </h2>
                <div className="h-[1px] w-20 bg-gold-400 mx-auto my-4" />
              </div>

              {/* Interactive Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {[
                  { time: "5:00 PM", title: "Guest Arrival", desc: "Welcome refreshments & light soft music under Heliopolis sun." },
                  { time: "6:00 PM", title: "The Royal Zaffa", desc: "A traditional lively Egyptian drumming escort for Yara & Ahmed." },
                  { time: "7:00 PM", title: "Grand Ceremony", desc: "The official ring exchange and matrimonial vows signing." },
                  { time: "8:00 PM", title: "Gala Dinner", desc: "A curated gourmet feast featuring fine Egyptian & Mediterranean cuisine." },
                  { time: "9:30 PM", title: "Cake & Dances", desc: "Traditional wedding cake cutting and opening of the dance floor." },
                  { time: "11:30 PM", title: "The Send-off", desc: "Sparkler exit and final celebratory farewell as husband & wife." }
                ].map((item, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.8 }}
                    className="bg-burgundy-900/50 border border-gold-400/10 p-6 rounded-2xl hover:border-gold-400/30 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-xs text-gold-400 font-semibold bg-burgundy-950 px-3 py-1 rounded-full border border-gold-400/10">
                        {item.time}
                      </span>
                      <div className="w-1.5 h-1.5 rounded-full bg-gold-400 group-hover:scale-150 transition-transform" />
                    </div>
                    <h4 className="font-serif-lux text-lg text-white font-medium group-hover:text-gold-200 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-burgundy-100/70 leading-relaxed mt-2">
                      {item.desc}
                    </p>
                  </motion.div>
                ))}

              </div>

            </div>
          </section>

          {/* ----------------- SECTION 6: RSVP (TASSLES ON LEFT) ----------------- */}
          <section id="rsvp" className="relative min-h-screen flex items-center bg-burgundy-900 overflow-hidden py-24 px-6 md:px-16">
            
            {/* Tassles decoration overlay on the left */}
            <div className="absolute top-0 bottom-0 left-0 w-36 md:w-48 z-0 pointer-events-none opacity-90 flex flex-col justify-start pt-12">
              {!mediaErrors["tassles"] ? (
                <img 
                  src="/media/tassles.png" 
                  alt="Tassles accent decoration"
                  onError={() => handleMediaError("tassles")}
                  className="w-full h-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                /* Fallback tassles text */
                <div className="p-8 text-[11px] text-gold-400/40 select-none font-serif-lux">
                  🎗️ Upload '/media/tassles.png'
                </div>
              )}
            </div>

            <div className="max-w-4xl mx-auto w-full relative z-10 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
              
              {/* Left Column intro */}
              <div className="md:col-span-5 space-y-6 text-center md:text-left">
                <motion.div 
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1 }}
                  className="space-y-4"
                >
                  <span className="text-xs text-gold-400 tracking-[0.2em] uppercase font-semibold">JOIN US</span>
                  <h2 className="font-serif-lux text-4xl md:text-6xl text-white tracking-wide leading-tight">
                    Confirm Attendance
                  </h2>
                  <div className="h-[1px] w-20 bg-gold-400 mx-auto md:mx-0 my-4" />
                  <p className="text-burgundy-100 text-xs md:text-sm leading-relaxed">
                    Please RSVP by August 15, 2026. Your presence would make our celebrations infinitely complete.
                  </p>
                </motion.div>
              </div>

              {/* Right Column RSVP Card Form */}
              <div className="md:col-span-7">
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1 }}
                  className="bg-burgundy-950 border border-gold-400/20 p-6 md:p-8 rounded-2xl shadow-2xl relative overflow-hidden"
                >
                  {/* Success Screen */}
                  <AnimatePresence mode="wait">
                    {rsvpSuccess ? (
                      <motion.div 
                        key="rsvp-success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center py-12 space-y-6 flex flex-col items-center"
                      >
                        <div className="w-16 h-16 rounded-full border border-gold-400 text-gold-400 flex items-center justify-center bg-burgundy-900 shadow-lg">
                          <Check className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-serif-lux text-2xl text-gold-200">Shukran, RSVP Saved!</h3>
                          <p className="text-xs text-burgundy-200 max-w-sm">We are incredibly excited to celebrate Yara & Ahmed's beautiful wedding day together with you.</p>
                        </div>
                        <button 
                          onClick={() => setRsvpSuccess(false)}
                          className="px-4 py-2 border border-gold-400/30 rounded-lg text-gold-300 text-xs hover:bg-gold-400/10 transition-colors"
                        >
                          Submit Another RSVP
                        </button>
                      </motion.div>
                    ) : (
                      /* RSVP Form fields */
                      <form key="rsvp-form" onSubmit={handleRsvpSubmit} className="space-y-4">
                        
                        <div className="space-y-1">
                          <label className="text-[10px] text-gold-300 tracking-wider block uppercase">Full Name</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g., Karim El-Shamy"
                            value={rsvpForm.guestName}
                            onChange={(e) => setRsvpForm({ ...rsvpForm, guestName: e.target.value })}
                            className="w-full bg-burgundy-900 border border-gold-400/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold-400 text-white placeholder-burgundy-300"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-gold-300 tracking-wider block uppercase">Are you attending?</label>
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <button 
                              type="button"
                              onClick={() => setRsvpForm({ ...rsvpForm, attending: true })}
                              className={`py-2 text-xs rounded-xl border font-bold transition-all ${
                                rsvpForm.attending 
                                  ? "bg-gold-400 border-gold-400 text-burgundy-950 shadow-md" 
                                  : "bg-burgundy-900 border-gold-400/10 text-gold-200/80 hover:bg-burgundy-900/60"
                              }`}
                            >
                              YES, ATTENDING
                            </button>
                            <button 
                              type="button"
                              onClick={() => setRsvpForm({ ...rsvpForm, attending: false })}
                              className={`py-2 text-xs rounded-xl border font-bold transition-all ${
                                !rsvpForm.attending 
                                  ? "bg-rose-600 border-rose-600 text-white shadow-md" 
                                  : "bg-burgundy-900 border-gold-400/10 text-gold-200/80 hover:bg-burgundy-900/60"
                              }`}
                            >
                              NO, DECLINING
                            </button>
                          </div>
                        </div>

                        {rsvpForm.attending && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="space-y-4 pt-2"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] text-gold-300 tracking-wider block uppercase">Extra Guests Accompanying</label>
                                <select 
                                  value={rsvpForm.guestsCount}
                                  onChange={(e) => setRsvpForm({ ...rsvpForm, guestsCount: Number(e.target.value) })}
                                  className="w-full bg-burgundy-900 border border-gold-400/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold-400 text-white"
                                >
                                  <option value={0}>Just Me (0 guests)</option>
                                  <option value={1}>+ 1 guest</option>
                                  <option value={2}>+ 2 guests</option>
                                  <option value={3}>+ 3 guests</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] text-gold-300 tracking-wider block uppercase">Dietary Requirements</label>
                                <input 
                                  type="text"
                                  placeholder="e.g., Vegetarian, Gluten Free"
                                  value={rsvpForm.dietary}
                                  onChange={(e) => setRsvpForm({ ...rsvpForm, dietary: e.target.value })}
                                  className="w-full bg-burgundy-900 border border-gold-400/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold-400 text-white placeholder-burgundy-300"
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}

                        <div className="space-y-1">
                          <label className="text-[10px] text-gold-300 tracking-wider block uppercase">Congratulatory Note</label>
                          <textarea 
                            rows={3}
                            placeholder="Write a sweet message to Yara & Ahmed..."
                            value={rsvpForm.message}
                            onChange={(e) => setRsvpForm({ ...rsvpForm, message: e.target.value })}
                            className="w-full bg-burgundy-900 border border-gold-400/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold-400 text-white placeholder-burgundy-300 resize-none"
                          />
                        </div>

                        <button 
                          type="submit"
                          disabled={rsvpSubmitting}
                          className="w-full py-3 bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 disabled:opacity-50 text-burgundy-950 font-bold rounded-xl text-xs tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                        >
                          {rsvpSubmitting ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              SUBMITTING...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              SUBMIT RSVP ANSWER
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

            </div>
          </section>

          {/* ----------------- SECTION 7: PHOTOS & GUEST GALLERY (FLOWER ON BOTTOM RIGHT) ----------------- */}
          <section id="guest-gallery" className="relative min-h-screen bg-burgundy-950 overflow-hidden py-24 px-6 md:px-16">
            
            {/* Flower decoration overlay on bottom right */}
            <div className="absolute bottom-0 right-0 w-80 md:w-96 z-0 pointer-events-none opacity-80">
              {!mediaErrors["flower"] ? (
                <img 
                  src="/media/flower.png" 
                  alt="Floral bloom decorations"
                  onError={() => handleMediaError("flower")}
                  className="w-full h-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                /* Fallback flower bloom text */
                <div className="absolute bottom-0 right-0 p-8 text-[11px] text-gold-400/40 select-none font-serif-lux">
                  🌸 Upload '/media/flower.png'
                </div>
              )}
            </div>

            <div className="max-w-6xl mx-auto w-full relative z-10 space-y-12">
              
              <div className="text-center space-y-4">
                <span className="text-xs text-gold-400 tracking-[0.2em] uppercase font-semibold">SHARED MEMORIES</span>
                <h2 className="font-serif-lux text-4xl md:text-6xl text-white tracking-wide">
                  Live Guest Gallery
                </h2>
                <div className="h-[1px] w-20 bg-gold-400 mx-auto my-4" />
                <p className="text-xs text-burgundy-200 max-w-md mx-auto">
                  Take photos during the wedding and upload them directly to our live screen photobooth!
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Upload Form Column */}
                <div className="lg:col-span-4 bg-burgundy-900/60 border border-gold-400/20 rounded-2xl p-6 shadow-xl space-y-6">
                  <div className="space-y-1">
                    <h3 className="font-serif-lux text-lg text-gold-200">Share Your Photos</h3>
                    <p className="text-xs text-burgundy-200">Submit snaps directly to the wedding stream.</p>
                  </div>

                  <form onSubmit={handlePhotoSubmit} className="space-y-4">
                    
                    <div className="space-y-1">
                      <label className="text-[10px] text-gold-300 tracking-wider block uppercase">Your Name</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g., Laila Sabry"
                        value={uploaderName}
                        onChange={(e) => setUploaderName(e.target.value)}
                        className="w-full bg-burgundy-950 border border-gold-400/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold-400 text-white placeholder-burgundy-300"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-gold-300 tracking-wider block uppercase">Short Caption</label>
                      <input 
                        type="text"
                        placeholder="e.g., Congratulations guys!"
                        value={photoCaption}
                        onChange={(e) => setPhotoCaption(e.target.value)}
                        className="w-full bg-burgundy-950 border border-gold-400/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold-400 text-white placeholder-burgundy-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-gold-300 tracking-wider block uppercase">Select Image</label>
                      <input 
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border border-dashed border-gold-400/30 rounded-xl p-4 text-center cursor-pointer hover:border-gold-400/60 transition-colors bg-burgundy-950"
                      >
                        {photoBase64 ? (
                          <div className="space-y-2">
                            <img src={photoBase64} alt="Selected preview" className="h-20 mx-auto rounded-lg object-cover" />
                            <span className="text-[10px] text-emerald-400 block font-medium">✓ Photo Selected Successfully</span>
                          </div>
                        ) : (
                          <div className="space-y-1.5 py-2">
                            <Upload className="w-5 h-5 text-gold-400 mx-auto" />
                            <span className="text-xs text-burgundy-200 block">Click to upload photo</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isUploadingPhoto || !photoBase64}
                      className="w-full py-2.5 bg-gold-400 hover:bg-gold-300 disabled:opacity-50 text-burgundy-950 font-bold rounded-xl text-xs tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isUploadingPhoto ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          SHARING...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          POST TO GALLERY
                        </>
                      )}
                    </button>

                  </form>
                </div>

                {/* Photo Stream Gallery Grid */}
                <div className="lg:col-span-8">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {photosList.map((photo, index) => (
                      <motion.div 
                        key={photo.id || index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05, duration: 0.6 }}
                        onClick={() => setSelectedPhoto(photo)}
                        className="relative group aspect-square rounded-2xl overflow-hidden border border-gold-400/15 bg-burgundy-900 cursor-pointer hover:border-gold-400/40 transition-all shadow-md"
                      >
                        <img 
                          src={photo.photoUrl} 
                          alt={photo.caption} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        {/* Elegant overlay card details */}
                        <div className="absolute inset-0 bg-gradient-to-t from-burgundy-950 via-burgundy-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 space-y-1 text-left">
                          <span className="text-[10px] text-gold-300 font-bold tracking-wide uppercase">By {photo.guestName}</span>
                          <span className="text-[11px] text-white line-clamp-2">"{photo.caption || "Happy celebrations!"}"</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </section>

          {/* ----------------- SECTIONS 8: FOOTER (MADE WITH LOVE) ----------------- */}
          <footer className="bg-burgundy-950 border-t border-gold-400/10 py-12 px-6 text-center text-xs text-burgundy-200/80 space-y-4">
            <div className="flex items-center justify-center gap-2 text-gold-400">
              <Heart className="w-4 h-4 fill-gold-400" />
              <span className="font-serif-lux text-base tracking-widest text-gold-200">Yara & Ahmed</span>
            </div>
            
            <div className="space-y-1">
              <p>made with love by everafterinvites</p>
              <a 
                href="https://www.instagram.com/_everafterinvites_/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-gold-400 hover:text-gold-300 transition-colors font-medium text-[11px]"
              >
                <Instagram className="w-3.5 h-3.5" />
                @_everafterinvites_
              </a>
            </div>
          </footer>

          {/* ----------------- PHOTO ZOOM PREVIEW MODAL ----------------- */}
          <AnimatePresence>
            {selectedPhoto && (
              <div className="fixed inset-0 bg-burgundy-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-burgundy-900 rounded-2xl shadow-2xl border border-gold-400/30 overflow-hidden max-w-2xl w-full flex flex-col"
                >
                  <div className="px-6 py-4 bg-burgundy-950 border-b border-gold-400/10 flex items-center justify-between">
                    <div>
                      <h4 className="font-serif-lux font-semibold text-gold-200 tracking-wide">Shared Memory</h4>
                      <p className="text-[10px] text-burgundy-300 uppercase tracking-widest">Uploaded by {selectedPhoto.guestName}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedPhoto(null)}
                      className="bg-burgundy-950 border border-gold-400/30 text-gold-300 hover:text-white px-3 py-1 rounded-full text-xs font-semibold transition-all"
                    >
                      Close
                    </button>
                  </div>

                  <div className="bg-burgundy-950 p-6 flex items-center justify-center min-h-[250px] max-h-[60vh] overflow-hidden">
                    <img 
                      src={selectedPhoto.photoUrl} 
                      alt={selectedPhoto.caption} 
                      className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {selectedPhoto.caption && (
                    <div className="px-6 py-4 bg-burgundy-950/40 text-center italic text-xs text-gold-100">
                      "{selectedPhoto.caption}"
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      )}

    </div>
  );
}
