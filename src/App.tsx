// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, Trash2, Copy, Check, Trophy, ArrowLeft, MapPin, Edit2, MessageCircle } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';

// --- FIREBASE ---
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

export default function HaliSahaKayit() {
  const [view, setView] = useState('home'); 
  const [matches, setMatches] = useState({});
  const [currentMatchId, setCurrentMatchId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState('');
  
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editNameValue, setEditNameValue] = useState('');

  const [newMatch, setNewMatch] = useState({
    creator: '', date: '', time: '', location: 'Haliç Spor Merkezi', capacity: 14
  });
  const [playerName, setPlayerName] = useState('');
  
  const [userRole, setUserRole] = useState('guest');
  const [myPlayerId, setMyPlayerId] = useState(null);

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
    });
  }, []);

  useEffect(() => {
    if (view === 'match' && currentMatchId && matches[currentMatchId]) {
      const timer = setInterval(() => {
        const match = matches[currentMatchId];
        if (!match.date || !match.time) return;
        const matchDate = new Date(`${match.date}T${match.time}`);
        const now = new Date();
        const diff = matchDate - now;
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          setCountdown(`${days} Gün ${hours} Saat Kaldı!`);
        } else {
          setCountdown("Maç Vakti Geldi!");
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [view, currentMatchId, matches]);

  const checkUserRole = (matchId) => {
    const creatorKey = `halisaha_creator_${matchId}`;
    const playerKey = `halisaha_player_${matchId}`;
    if (localStorage.getItem(creatorKey)) {
      setUserRole('creator');
    } else if (localStorage.getItem(playerKey)) {
      setUserRole('player');
      setMyPlayerId(localStorage.getItem(playerKey));
    } else {
      setUserRole('guest');
    }
  };

  const saveToFirebase = (matchId, data) => {
    set(ref(db, 'matches/' + matchId), data);
  };

  const goToHome = () => {
    window.history.pushState({}, '', window.location.pathname);
    setCurrentMatchId(null);
    setView('home');
  };

  const createMatch = () => {
    if (!newMatch.creator || !newMatch.date || !newMatch.time) return alert('Lütfen tüm alanları doldurun!');
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
    if (!playerName.trim()) return;
    const match = matches[currentMatchId];
    if (userRole === 'player') return alert("Zaten listedesin! İstersen ismini düzenleyebilirsin.");
    if (match.players?.length >= match.capacity) return alert('Kadro maalesef doldu!');
    
    const playerId = Date.now().toString();
    const updatedPlayers = [...(match.players || []), { 
        id: playerId, name: playerName.trim(), isCreator: false, 
        time: new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) 
    }];
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

  const startEditing = (player) => {
    setEditingPlayerId(player.id);
    setEditNameValue(player.name);
  };

  const saveEdit = (pid) => {
    const match = matches[currentMatchId];
    const updatedPlayers = match.players.map(p => {
        if (p.id === pid) return { ...p, name: editNameValue };
        return p;
    });
    saveToFirebase(currentMatchId, { ...match, players: updatedPlayers });
    setEditingPlayerId(null);
  };

  const shareToWhatsApp = () => {
    const m = matches[currentMatchId];
    let text = `⚽ *MAÇ VAR!* \n\n📍 *Saha:* ${m.location}\n📅 *Tarih:* ${new Date(m.date).toLocaleDateString('tr-TR')}\n⏰ *Saat:* ${m.time}\n\n🏃‍♂️ *KADRO:* \n`;
    m.players.forEach((p, i) => {
        text += `${i+1}. ${p.name} \n`;
    });
    text += `\n🔥 *Hazır mıyız?*`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- HTML (JSX) YAPISI ---

  if (view === 'home') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel w-full max-w-lg rounded-[2rem] p-10 text-center animate-fade-in">
          <div className="bg-white w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 shadow-lg">
            <Trophy size={48} className="text-green-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Halı Saha</h1>
          <p className="text-gray-700 mb-10 font-medium text-lg">Maçını planla, kadronu kur, efsane ol!</p>
          
          <button onClick={() => setView('create')} className="btn-primary w-full text-white py-5 rounded-2xl font-bold text-xl shadow-xl flex items-center justify-center gap-3">
            Yeni Maç Oluştur
          </button>
        </div>
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel w-full max-w-2xl rounded-[2rem] p-8 shadow-2xl relative animate-fade-in">
          <button onClick={goToHome} className="absolute left-8 top-8 bg-white/50 p-3 rounded-full hover:bg-white transition-all"><ArrowLeft size={24}/></button>
          <h2 className="text-3xl font-black text-center mb-10 text-gray-800">Maç Detayları</h2>
          
          <div className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-gray-800 mb-2 ml-1">Senin Adın (Kurucu)</label>
                <input className="input-glass w-full p-4 rounded-xl font-bold text-lg text-gray-900 placeholder-gray-500" placeholder="İsminiz..." value={newMatch.creator} onChange={e=>setNewMatch({...newMatch, creator: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2 ml-1">Tarih</label>
                    <input type="date" className="input-glass w-full p-4 rounded-xl font-medium text-gray-900" value={newMatch.date} onChange={e=>setNewMatch({...newMatch, date: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2 ml-1">Saat</label>
                    <input type="time" className="input-glass w-full p-4 rounded-xl font-medium text-gray-900" value={newMatch.time} onChange={e=>setNewMatch({...newMatch, time: e.target.value})} />
                </div>
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-800 mb-2 ml-1">Saha Adı</label>
                <input className="input-glass w-full p-4 rounded-xl font-medium text-gray-900 placeholder-gray-500" placeholder="Örn: Haliç Spor Tesisleri" value={newMatch.location} onChange={e=>setNewMatch({...newMatch, location: e.target.value})} />
            </div>
            <button onClick={createMatch} className="btn-primary w-full text-white py-5 rounded-2xl font-bold text-xl shadow-lg mt-6">Maçı Oluştur</button>
          </div>
        </div>
      </div>
    );
  }

  const m = matches[currentMatchId];
  if (!m) return <div className="min-h-screen flex items-center justify-center text-white font-bold text-2xl animate-pulse">Yükleniyor...</div>;
  const isFull = m.players?.length >= m.capacity;

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl glass-panel rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[650px] animate-fade-in">
        
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 md:w-1/3 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-green-500 rounded-full blur-[120px] opacity-20 -mr-32 -mt-32"></div>
            
            <div>
                <button onClick={goToHome} className="bg-white/10 hover:bg-white/20 p-3 rounded-full mb-8 transition-all"><ArrowLeft size={24}/></button>
                <div className="bg-green-500/20 text-green-300 px-4 py-2 rounded-full text-xs font-bold inline-block mb-4 border border-green-500/30 shadow-lg">
                    {countdown}
                </div>
                <h2 className="text-4xl font-black leading-tight mb-6">{m.location}</h2>
                <div className="space-y-4 opacity-90 text-base font-medium">
                    <p className="flex items-center gap-3"><Calendar size={20} className="text-green-400"/> {new Date(m.date).toLocaleDateString('tr-TR', {day:'numeric', month:'long', weekday:'long'})}</p>
                    <p className="flex items-center gap-3"><Clock size={20} className="text-green-400"/> {m.time}</p>
                    <p className="flex items-center gap-3"><Users size={20} className="text-green-400"/> {m.players?.length || 0} / {m.capacity} Kişi</p>
                </div>
            </div>

            <div className="mt-8 space-y-3">
                <button onClick={copyLink} className="w-full bg-white/10 hover:bg-white/20 border border-white/10 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                    {copied ? <Check size={20}/> : <Copy size={20}/>} {copied ? 'Kopyalandı' : 'Linki Paylaş'}
                </button>
            </div>
        </div>

        <div className="p-6 md:p-10 md:w-2/3 bg-white/60 backdrop-blur-md flex flex-col">
            
            {isFull ? (
                <div className="mb-8 animate-pulse">
                    <button onClick={shareToWhatsApp} className="w-full bg-green-500 hover:bg-green-600 text-white py-5 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02]">
                        <MessageCircle size={28}/> Kadro Doldu! WhatsApp'a At
                    </button>
                </div>
            ) : (
                userRole !== 'player' && (
                    // --- DÜZELTME BURADA: Senin CSS sınıflarını kullandık ---
                    <div className="input-row">
                        <input 
                            type="text" 
                            placeholder="Adını yaz ve katıl..." 
                            value={playerName} 
                            onChange={e=>setPlayerName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                        />
                        <button className="add-btn" onClick={addPlayer}>
                            +
                        </button>
                    </div>
                )
            )}

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 text-xl flex items-center gap-2">Kadro</h3>
                    <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-bold">{m.players?.length} Oyuncu</span>
                </div>
                
                <div className="grid gap-3">
                    {m.players?.map((p, i) => {
                        const isMe = p.id === myPlayerId;
                        const isCreator = p.isCreator;
                        const canEdit = (userRole === 'creator') || isMe;

                        return (
                            <div key={i} className={`player-card p-4 rounded-xl flex items-center justify-between ${isMe ? 'border-l-4 border-l-green-500 bg-white' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <span className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shadow-sm flex-shrink-0 ${isCreator ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-200 text-gray-600'}`}>{i+1}</span>
                                    
                                    {editingPlayerId === p.id ? (
                                        <div className="flex gap-2 w-full">
                                            <input className="w-full p-2 rounded border-2 border-green-500 text-gray-900 font-bold" value={editNameValue} onChange={e=>setEditNameValue(e.target.value)} autoFocus />
                                            <button onClick={()=>saveEdit(p.id)} className="bg-green-600 text-white p-2 rounded-lg flex-shrink-0"><Check size={18}/></button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-gray-800 text-lg flex items-center gap-2 truncate">
                                                {p.name}
                                                {isCreator && <Trophy size={16} className="text-yellow-500 fill-yellow-500 flex-shrink-0"/>}
                                                {isMe && <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded border border-green-200 flex-shrink-0">SEN</span>}
                                            </span>
                                            <span className="text-xs text-gray-500 font-medium">{p.time}</span>
                                        </div>
                                    )}
                                </div>

                                {canEdit && !editingPlayerId && (
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button onClick={()=>startEditing(p)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="İsmi Düzenle"><Edit2 size={18}/></button>
                                        <button onClick={()=>removePlayer(p.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Kişiyi Sil"><Trash2 size={18}/></button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      </div>
      <div className="mt-6 text-white/50 text-sm font-medium">Ugrem tarafından tasarlandı</div>
    </div>
  );
}