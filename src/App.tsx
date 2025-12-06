// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Users, Calendar, Clock, Trash2, Copy, Check, Trophy, PlusCircle, ArrowLeft, Edit2, MessageCircle, CloudRain, Sun, Cloud, BellRing, Globe } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';

// --- FIREBASE AYARLARI ---
const firebaseConfig = {
  apiKey: "AIzaSyALTHDel3NEmHlZq0q2WhU4p0ACcRHuCuQ",
  authDomain: "halisaha-5265d.firebaseapp.com",
  projectId: "halisaha-5265d",
  storageBucket: "halisaha-5265d.firebasestorage.app",
  messagingSenderId: "709091528292",
  appId: "1:709091528292:web:0ab3cf769818debefa1971",
  measurementId: "G-P7DZXPEWDB",
  databaseURL: "https://halisaha-5265d-default-rtdb.firebaseio.com" 
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- SAAT LİSTESİ (00:00 - 23:30) ---
const generateTimeOptions = () => {
  const times = [];
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0');
    times.push(`${hour}:00`);
    times.push(`${hour}:30`);
  }
  return times;
};
const timeOptions = generateTimeOptions();

// --- DİL ÇEVİRİLERİ ---
const translations = {
  tr: {
    title: "Halı Saha",
    subtitle: "Maçını planla, kadronu kur, efsane ol!",
    createBtn: "Yeni Maç Oluştur",
    matchDetails: "Maç Detayları",
    creatorPhone: "WhatsApp Numaran (Bildirimler için)",
    creatorPhonePlaceholder: "Örn: +905551234567",
    date: "Tarih",
    time: "Saat",
    location: "Saha Adı",
    locationPlace: "Örn: Haliç Spor Tesisleri",
    capacity: "Kişi Kapasitesi",
    create: "Oluştur",
    loading: "Yükleniyor...",
    share: "Linki Paylaş",
    copied: "Kopyalandı!",
    whatsapp: "Kadro Doldu! WhatsApp'a At",
    addPlace: "Adını yaz ve katıl...",
    roster: "Kadro",
    you: "SEN",
    weatherTitle: "Tahmini Hava",
    matchTime: "Maç Başladı!",
    alertFull: "🎉 TEBRİKLER! Kadro doldu!",
    alertLeft: "⚠️ DİKKAT! Biri kadrodan çıktı!",
    shortName: "İsim en az 3 harf olmalı!",
    footer: "Made with ❤️",
    quotes: [
      "Sahaya çık ve efsane ol! 🔥",
      "Bugün kazanmak için harika bir gün! ⚽",
      "Kramponları hazırla, şov zamanı! 👟",
      "Takım ruhu her şeydir! 💪",
      "Sahaların kralı sensin! 👑"
    ]
  },
  tg: {
    title: "Футбол",
    subtitle: "Бозиро ба нақша гир, дастаро ҷамъ кун!",
    createBtn: "Бозии нав сохтан",
    matchDetails: "Тафсилоти бозӣ",
    creator: "Номи шумо (Ташкилкунанда)",
    date: "Сана",
    time: "Вақт",
    location: "Номи майдон",
    locationPlace: "Мас: Варзишгоҳи Истиқлол",
    capacity: "Теъдоди бозигарон",
    create: "Сохтан",
    loading: "Боргирӣ...",
    share: "Ирсоли пайванд",
    copied: "Нусхабардорӣ шуд!",
    whatsapp: "Даста пур шуд! WhatsApp",
    addPlace: "Номатро навис...",
    roster: "Ҳайат",
    you: "ТУ",
    weatherTitle: "Обу ҳаво",
    matchTime: "Вақти бозӣ!",
    alertFull: "🎉 ТАБРИК! Даста пур шуд!",
    alertLeft: "⚠️ ДИҚҚАТ! Як нафар баромад!",
    shortName: "Ном бояд ҳадди аққал 3 ҳарф бошад!",
    footer: "Бо ❤️ сохта шуд",
    quotes: [
      "Ба майдон баро ва қаҳрамон шав! 🔥",
      "Имрӯз рӯзи ғалаба аст! ⚽",
      "Ба бозӣ омода шав! 👟",
      "Рӯҳияи даста муҳим аст! 💪",
      "Подшоҳи майдон ту ҳастӣ! 👑"
    ]
  }
};

export default function HaliSahaKayit() {
  const [view, setView] = useState('home'); 
  const [matches, setMatches] = useState({});
  const [currentMatchId, setCurrentMatchId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState('tr'); 
  const [weather, setWeather] = useState(null); 
  const [countdown, setCountdown] = useState(''); 
  const [motivation, setMotivation] = useState(''); 

  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editNameValue, setEditNameValue] = useState('');
  
  const [newMatch, setNewMatch] = useState({ 
    creator: '', date: '', time: '20:00', location: 'Haliç Spor Merkezi', capacity: 14, creatorPhone: '' 
  });
  
  const [playerName, setPlayerName] = useState('');
  const [userRole, setUserRole] = useState('guest');
  const [myPlayerId, setMyPlayerId] = useState(null);

  const prevPlayerCount = useRef(0);
  const [notification, setNotification] = useState(null);

  const t = translations[lang];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get('match');
    if (matchId) {
      setCurrentMatchId(matchId);
      setView('match');
      checkUserRole(matchId);
    }
  }, []);

  useEffect(() => {
    const matchesRef = ref(db, 'matches');
    onValue(matchesRef, (snapshot) => {
      const data = snapshot.val();
      setMatches(data || {});
      
      if (currentMatchId && data && data[currentMatchId]) {
        const currentMatch = data[currentMatchId];
        const currentCount = currentMatch.players ? currentMatch.players.length : 0;
        const capacity = currentMatch.capacity;

        if (prevPlayerCount.current < capacity && currentCount >= capacity) {
           showNotification(t.alertFull, 'success');
        }
        else if (prevPlayerCount.current === capacity && currentCount < capacity) {
           showNotification(t.alertLeft, 'error');
        }
        prevPlayerCount.current = currentCount;
      }
    });
  }, [currentMatchId, lang]);

  useEffect(() => {
    if (view === 'match' && currentMatchId && matches[currentMatchId]) {
      const m = matches[currentMatchId];
      if (!m.date) return;
      const lat = 41.0082;
      const lon = 28.9784;
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max&timezone=auto&start_date=${m.date}&end_date=${m.date}`)
        .then(res => res.json())
        .then(data => {
          if (data.daily && data.daily.temperature_2m_max) {
            const code = data.daily.weather_code[0];
            const temp = data.daily.temperature_2m_max[0];
            let icon = <Sun size={24} className="text-yellow-400"/>;
            let text = "Açık";
            if (code > 3 && code < 50) { icon = <Cloud size={24} className="text-gray-200"/>; text = "Bulutlu"; }
            if (code >= 50) { icon = <CloudRain size={24} className="text-blue-300"/>; text = "Yağmurlu"; }
            setWeather({ temp, icon, text });
          }
        })
        .catch(err => console.log("Hava durumu alınamadı", err));
    }
  }, [view, currentMatchId, matches]);

  useEffect(() => {
    if (view === 'match' && currentMatchId && matches[currentMatchId]) {
      if (!motivation) {
        const randomQuote = t.quotes[Math.floor(Math.random() * t.quotes.length)];
        setMotivation(randomQuote);
      }
      const timer = setInterval(() => {
        const m = matches[currentMatchId];
        const matchDate = new Date(`${m.date}T${m.time}`);
        const now = new Date();
        const diff = matchDate - now;
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const dStr = lang === 'tr' ? 'g' : 'р';
          const hStr = lang === 'tr' ? 's' : 'с';
          const mStr = lang === 'tr' ? 'dk' : 'дақ';
          setCountdown(`${days}${dStr} ${hours}${hStr} ${minutes}${mStr}`);
        } else {
          setCountdown(t.matchTime);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [view, currentMatchId, matches, lang]);

  const showNotification = (msg, type) => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const checkUserRole = (matchId) => {
    if (localStorage.getItem(`halisaha_creator_${matchId}`)) setUserRole('creator');
    else if (localStorage.getItem(`halisaha_player_${matchId}`)) {
      setUserRole('player');
      setMyPlayerId(localStorage.getItem(`halisaha_player_${matchId}`));
    } else setUserRole('guest');
  };

  const saveToFirebase = (matchId, data) => set(ref(db, 'matches/' + matchId), data);

  const goToHome = () => {
    window.history.pushState({}, '', window.location.pathname);
    setCurrentMatchId(null);
    setView('home');
  };

  const createMatch = () => {
    if (!newMatch.creator || newMatch.creator.trim().length < 3) return alert(t.shortName);
    if (!newMatch.date || !newMatch.time) return alert('Eksik bilgi!');
    
    const matchId = Date.now().toString(36);
    const creatorId = Date.now().toString();
    const matchData = {
      id: matchId, ...newMatch, createdAt: new Date().toISOString(),
      players: [{ id: creatorId, name: newMatch.creator, isCreator: true, time: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) }]
    };
    saveToFirebase(matchId, matchData);
    localStorage.setItem(`halisaha_creator_${matchId}`, 'true');
    setCurrentMatchId(matchId);
    window.history.pushState({}, '', `?match=${matchId}`);
    setView('match');
    checkUserRole(matchId);
  };

  const addPlayer = () => {
    if (!playerName.trim() || playerName.trim().length < 3) return alert(t.shortName);
    const match = matches[currentMatchId];
    if (userRole === 'player') return alert("Zaten listedesin!");
    if (match.players?.length >= match.capacity) return alert('Dolu!');
    const playerId = Date.now().toString();
    const updatedPlayers = [...(match.players || []), { id: playerId, name: playerName.trim(), isCreator: false, time: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) }];
    saveToFirebase(currentMatchId, { ...match, players: updatedPlayers });
    if (userRole !== 'creator') {
        localStorage.setItem(`halisaha_player_${currentMatchId}`, playerId);
        setUserRole('player');
        setMyPlayerId(playerId);
    }
    setPlayerName('');
  };

  const removePlayer = (pid) => {
    const match = matches[currentMatchId];
    const updatedPlayers = match.players.filter(p => p.id !== pid);
    saveToFirebase(currentMatchId, { ...match, players: updatedPlayers });
    if (myPlayerId === pid) {
        localStorage.removeItem(`halisaha_player_${currentMatchId}`);
        if(userRole!=='creator') setUserRole('guest');
        setMyPlayerId(null);
    }
  };

  const saveEdit = (pid) => {
    if (!editNameValue || editNameValue.trim().length < 3) return alert(t.shortName);
    const match = matches[currentMatchId];
    const updatedPlayers = match.players.map(p => p.id === pid ? { ...p, name: editNameValue } : p);
    saveToFirebase(currentMatchId, { ...match, players: updatedPlayers });
    setEditingPlayerId(null);
  };

  const shareToWhatsApp = () => {
    const m = matches[currentMatchId];
    let text = `⚽ *${t.title}* \n\n📍 ${m.location}\n📅 ${new Date(m.date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'tg-TJ')}\n⏰ ${m.time}\n\n`;
    m.players.forEach((p, i) => { text += `${i+1}. ${p.name} \n`; });
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const LangSwitch = () => (
    <button onClick={()=>setLang(lang==='tr'?'tg':'tr')} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full backdrop-blur-md transition-all flex items-center gap-2 z-50 font-bold text-xs border border-white/20 shadow-lg">
        <Globe size={14}/> {lang === 'tr' ? '🇹🇷 TR' : '🇹🇯 TJ'}
    </button>
  );

  const NotificationToast = () => (
    notification && (
        <div className={`fixed top-10 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            <BellRing size={24} className="animate-pulse"/>
            <span className="font-bold text-lg">{notification.msg}</span>
        </div>
    )
  );

  // 1. OLUŞTURMA SAYFASI
  if (view === 'create') {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600">
          <style>{`
            @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            .animate-fade-in { animation: fade-in 0.6s ease-out; }
            .glass-panel { background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.3); }
            .input-glass { background: rgba(255, 255, 255, 0.9); border: 2px solid rgba(255, 255, 255, 0.5); transition: all 0.3s; }
            .input-glass:focus { outline: none; border-color: rgb(34, 197, 94); box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1); }
            .btn-primary { background: linear-gradient(135deg, #10b981 0%, #059669 100%); transition: all 0.3s; }
            .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4); }
          `}</style>
          <div className="glass-panel w-full max-w-2xl rounded-[2rem] p-8 shadow-2xl relative animate-fade-in">
            <button onClick={goToHome} className="absolute left-8 top-8 bg-white/50 p-3 rounded-full hover:bg-white transition-all"><ArrowLeft size={24}/></button>
            <h2 className="text-3xl font-black text-center mb-10 text-gray-800">{t.matchDetails}</h2>
            <div className="space-y-6">
              <div><label className="block text-sm font-bold text-gray-800 mb-2 ml-1">{t.creator}</label><input className="input-glass w-full p-4 rounded-xl font-bold" placeholder="..." value={newMatch.creator} onChange={e=>setNewMatch({...newMatch, creator: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-6">
                  <div><label className="block text-sm font-bold text-gray-800 mb-2 ml-1">{t.date}</label><input type="date" className="input-glass w-full p-4 rounded-xl" value={newMatch.date} onChange={e=>setNewMatch({...newMatch, date: e.target.value})} /></div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2 ml-1">{t.time}</label>
                    <select className="input-glass w-full p-4 rounded-xl" value={newMatch.time} onChange={e=>setNewMatch({...newMatch, time: e.target.value})}>
                        {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
                    </select>
                  </div>
              </div>
              <div><label className="block text-sm font-bold text-gray-800 mb-2 ml-1">{t.location}</label><input className="input-glass w-full p-4 rounded-xl" placeholder={t.locationPlace} value={newMatch.location} onChange={e=>setNewMatch({...newMatch, location: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-gray-800 mb-2 ml-1">{t.capacity}</label><select className="input-glass w-full p-4 rounded-xl" value={newMatch.capacity} onChange={e=>setNewMatch({...newMatch, capacity: Number(e.target.value)})}>{[10, 12, 14, 16, 18, 20, 22, 24].map(num => <option key={num} value={num}>{num}</option>)}</select></div>
              <button onClick={createMatch} className="btn-primary w-full text-white py-5 rounded-2xl font-bold text-xl shadow-lg mt-6">{t.create}</button>
            </div>
          </div>
        </div>
      );
  }

  // 2. ANA SAYFA
  if (view === 'home') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative bg-gradient-to-br from-green-400 via-blue-500 to-purple-600">
        <style>{`
          @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in { animation: fade-in 0.6s ease-out; }
          .glass-panel { background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.3); }
          .btn-primary { background: linear-gradient(135deg, #10b981 0%, #059669 100%); transition: all 0.3s; }
          .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4); }
        `}</style>
        <div className="absolute top-6 right-6 flex gap-3 z-50">
            <button onClick={()=>setLang('tr')} className={`px-4 py-2 rounded-xl font-bold transition-all shadow-lg ${lang==='tr' ? 'bg-white text-green-700 scale-110' : 'bg-white/30 text-white hover:bg-white/50'}`}>🇹🇷 TR</button>
            <button onClick={()=>setLang('tg')} className={`px-4 py-2 rounded-xl font-bold transition-all shadow-lg ${lang==='tg' ? 'bg-white text-green-700 scale-110' : 'bg-white/30 text-white hover:bg-white/50'}`}>🇹🇯 TJ</button>
        </div>
        <div className="glass-panel w-full max-w-lg rounded-[2rem] p-10 text-center animate-fade-in">
          <div className="bg-white w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 shadow-lg">
            <Trophy size={48} className="text-green-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">{t.title}</h1>
          <p className="text-gray-700 mb-10 font-medium text-lg">{t.subtitle}</p>
          <button onClick={() => setView('create')} className="btn-primary w-full text-white py-5 rounded-2xl font-bold text-xl shadow-xl flex items-center justify-center gap-3">
            <PlusCircle size={28} /> {t.createBtn}
          </button>
        </div>
      </div>
    );
  }

  // 3. MAÇ DETAY
  const m = matches[currentMatchId];
  if (!m && view === 'match') return (
    <div className="min-h-screen flex items-center justify-center text-white font-bold text-2xl animate-pulse bg-gradient-to-br from-green-400 via-blue-500 to-purple-600">
      {t.loading}
    </div>
  );

  const isFull = m.players?.length >= m.capacity;

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center bg-gradient-to-br from-green-400 via-blue-500 to-purple-600">
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .glass-panel { background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.3); }
        .input-glass { background: rgba(255, 255, 255, 0.9); border: 2px solid rgba(255, 255, 255, 0.5); transition: all 0.3s; }
        .input-glass:focus { outline: none; border-color: rgb(34, 197, 94); box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1); }
        .input-row { display: flex; gap: 0.75rem; margin-bottom: 2rem; }
        .add-btn { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; width: 56px; height: 56px; border-radius: 1rem; font-size: 2rem; font-weight: bold; flex-shrink: 0; transition: all 0.3s; }
        .add-btn:hover { transform: scale(1.05); box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4); }
        .player-card { background: rgba(255, 255, 255, 0.6); transition: all 0.3s; }
        .player-card:hover { background: rgba(255, 255, 255, 0.8); transform: translateX(4px); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.5); border-radius: 10px; }
      `}</style>
      <LangSwitch />
      <NotificationToast />

      <div className="w-full max-w-5xl glass-panel rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[650px] animate-fade-in">
        
        {/* SOL PANEL */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 md:w-1/3 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-green-500 rounded-full blur-[120px] opacity-20 -mr-32 -mt-32"></div>
            <div>
                <button onClick={goToHome} className="bg-white/10 hover:bg-white/20 p-3 rounded-full mb-6 transition-all"><ArrowLeft size={24}/></button>
                
                {weather && (
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl mb-6 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            {weather.icon}
                            <div>
                                <div className="text-xs text-gray-300 font-bold uppercase">{t.weatherTitle}</div>
                                <div className="text-xl font-bold">{weather.temp}°C</div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col items-center mb-6">
                    <div className="inline-flex items-center gap-2 bg-black/20 hover:bg-black/30 backdrop-blur-lg border border-white/10 px-4 py-2 rounded-full shadow-lg transition-all group cursor-default">
                        <div className="bg-green-500/20 p-1.5 rounded-full group-hover:scale-110 transition-transform">
                            <Clock size={14} className="text-green-400 animate-pulse"/>
                        </div>
                        <span className="font-bold text-white text-sm tracking-wide font-mono tabular-nums opacity-90">
                            {countdown}
                        </span>
                    </div>
                    <div className="mt-3 text-xs font-medium text-green-200/80 italic max-w-[200px] text-center leading-relaxed">
                        "{motivation}"
                    </div>
                </div>

                <h2 className="text-3xl font-black leading-tight mb-4">{m.location}</h2>
                <div className="space-y-4 opacity-90 text-base font-medium border-t border-white/10 pt-6">
                    <p className="flex items-center gap-3"><Calendar size={20} className="text-green-400"/> {new Date(m.date).toLocaleDateString(lang==='tr'?'tr-TR':'tg-TJ', {day:'numeric', month:'long'})}</p>
                    <p className="flex items-center gap-3"><Clock size={20} className="text-green-400"/> {m.time}</p>
                    <p className="flex items-center gap-3"><Users size={20} className="text-green-400"/> {m.players?.length || 0} / {m.capacity}</p>
                </div>
            </div>
            <div className="mt-8"><button onClick={copyLink} className="w-full bg-white/10 hover:bg-white/20 border border-white/10 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">{copied ? <Check size={20}/> : <Copy size={20}/>} {copied ? t.copied : t.share}</button></div>
        </div>

        {/* SAĞ PANEL */}
        <div className="p-6 md:p-10 md:w-2/3 bg-white/60 backdrop-blur-md flex flex-col">
            {isFull ? (
                <div className="mb-8 animate-pulse"><button onClick={shareToWhatsApp} className="w-full bg-green-500 hover:bg-green-600 text-white py-5 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-3 transition-all"><MessageCircle size={28}/> {t.whatsapp}</button></div>
            ) : (
                userRole !== 'player' && (
                    <div className="input-row">
                        <input className="input-glass flex-1 p-4 rounded-xl font-bold" placeholder={t.addPlace} value={playerName} onChange={e=>setPlayerName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPlayer()} />
                        <button className="add-btn" onClick={addPlayer}>+</button>
                    </div>
                )
            )}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-gray-800 text-xl">{t.roster}</h3><span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-bold">{m.players?.length}</span></div>
                <div className="grid gap-3">
                    {m.players?.map((p, i) => {
                        const isMe = p.id === myPlayerId;
                        const isCreator = p.isCreator;
                        const canEdit = (userRole === 'creator') || isMe;
                        return (
                            <div key={i} className={`player-card p-4 rounded-xl flex items-center justify-between ${isMe ? 'border-l-4 border-l-green-500 bg-white' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <span className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shadow-sm ${isCreator ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-200 text-gray-600'}`}>{i+1}</span>
                                    {editingPlayerId === p.id ? (
                                        <div className="flex gap-2 w-full"><input className="w-full p-2 rounded border-2 border-green-500 font-bold" value={editNameValue} onChange={e=>setEditNameValue(e.target.value)} autoFocus /><button onClick={()=>saveEdit(p.id)} className="bg-green-600 text-white p-2 rounded-lg flex-shrink-0"><Check size={18}/></button></div>
                                    ) : (
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-gray-800 text-lg flex items-center gap-2 truncate">{p.name}{isCreator && <Trophy size={16} className="text-yellow-500 fill-yellow-500 flex-shrink-0"/>}{isMe && <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded border border-green-200 flex-shrink-0">{t.you}</span>}</span>
                                            <span className="text-xs text-gray-500 font-medium">{p.time}</span>
                                        </div>
                                    )}
                                </div>
                                {canEdit && !editingPlayerId && (
                                    <div className="flex gap-2 flex-shrink-0"><button onClick={()=>setEditingPlayerId(p.id)||setEditNameValue(p.name)} className="p-2 text-gray-400 hover:text-blue-600 transition-all"><Edit2 size={18}/></button><button onClick={()=>removePlayer(p.id)} className="p-2 text-gray-400 hover:text-red-600 transition-all"><Trash2 size={18}/></button></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      </div>
      <div className="mt-6 text-white/70 text-sm font-medium">{t.footer}</div>
    </div>
  );
}