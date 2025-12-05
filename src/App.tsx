// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, Trash2, Copy, Check, Trophy, PlusCircle, ArrowLeft, MapPin, Edit2, ShieldAlert } from 'lucide-react';
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

export default function HaliSahaKayit() {
  const [view, setView] = useState('home'); 
  const [matches, setMatches] = useState({});
  const [currentMatchId, setCurrentMatchId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState('');
  
  const [newMatch, setNewMatch] = useState({
    creator: '', date: '', time: '', location: 'Haliç Spor Merkezi', capacity: 14
  });
  const [playerName, setPlayerName] = useState('');
  
  // --- KİMLİK KONTROLÜ (LOCALSTORAGE) ---
  // Kullanıcının bu tarayıcıdaki rolünü ve eklediği oyuncu ID'sini tutar
  const [userRole, setUserRole] = useState<'creator' | 'player' | 'guest'>('guest');
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);

  // 1. URL KONTROLÜ
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get('match');
    if (matchId) {
      setCurrentMatchId(matchId);
      setView('match');
      checkUserRole(matchId);
    }
  }, []);

  // 2. VERİLERİ ÇEK
  useEffect(() => {
    const matchesRef = ref(db, 'matches');
    onValue(matchesRef, (snapshot) => {
      const data = snapshot.val();
      setMatches(data || {});
    });
  }, []);

  // 3. GERİ SAYIM SAYACI
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
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          
          let text = "🔥 Maça ";
          if (days > 0) text += `${days} gün `;
          if (hours > 0) text += `${hours} saat `;
          text += `${minutes} dakika kaldı! Hazır mısın?`;
          setCountdown(text);
        } else {
          setCountdown("⚽ Maç saati geldi veya geçti!");
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [view, currentMatchId, matches]);

  // --- YARDIMCI FONKSİYONLAR ---
  
  const checkUserRole = (matchId) => {
    const creatorKey = `halisaha_creator_${matchId}`;
    const playerKey = `halisaha_player_${matchId}`; // Oyuncu ID'sini tutar

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
    setCountdown('');
  };

  // --- MAÇ OLUŞTURMA ---
  const createMatch = () => {
    if (!newMatch.creator || !newMatch.date || !newMatch.time) {
      alert('Lütfen eksik bilgileri doldurun!');
      return;
    }
    const matchId = Date.now().toString(36); 
    const creatorId = Date.now().toString(); // Kurucu için benzersiz ID

    const matchData = {
      id: matchId,
      ...newMatch,
      createdAt: new Date().toISOString(),
      players: [{ 
        id: creatorId,
        name: newMatch.creator, 
        isCreator: true, 
        time: new Date().toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'}) 
      }]
    };

    saveToFirebase(matchId, matchData);
    
    // Kurucu olduğunu tarayıcıya kaydet
    localStorage.setItem(`halisaha_creator_${matchId}`, 'true');
    localStorage.setItem(`halisaha_player_${matchId}`, creatorId);

    setCurrentMatchId(matchId);
    window.history.pushState({}, '', `?match=${matchId}`);
    setView('match');
    checkUserRole(matchId);
    setNewMatch({ creator: '', date: '', time: '', location: 'Haliç Spor Merkezi', capacity: 14 });
  };

  // --- OYUNCU EKLEME ---
  const addPlayer = () => {
    if (!playerName.trim()) return;
    const match = matches[currentMatchId];
    if (!match) return;
    
    // KURAL: Zaten oyuncuysa tekrar ekleyemez (Kurucu değilse)
    if (userRole === 'player') {
        alert("Zaten bir isim yazmışsın! Sadece kendi ismini silebilirsin.");
        return;
    }

    if (match.players && match.players.length >= match.capacity) { 
        alert('Kadro Dolu!'); return; 
    }

    const currentPlayers = match.players || [];
    if (currentPlayers.some((p) => p.name.toLowerCase() === playerName.trim().toLowerCase())) { 
        alert('Bu isim zaten kadroda var!'); return; 
    }

    const playerId = Date.now().toString(); // Oyuncu için ID
    const updatedPlayers = [...currentPlayers, { 
        id: playerId,
        name: playerName.trim(), 
        isCreator: false, 
        time: new Date().toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'}) 
    }];
    
    saveToFirebase(currentMatchId, { ...match, players: updatedPlayers });
    
    // Kurucu değilse, bu tarayıcıya "ben oyuncuyum ve ID'm bu" diye kaydet
    if (userRole !== 'creator') {
        localStorage.setItem(`halisaha_player_${currentMatchId}`, playerId);
        setUserRole('player');
        setMyPlayerId(playerId);
    }
    
    setPlayerName('');
  };

  // --- OYUNCU SİLME / DÜZENLEME ---
  const removePlayer = (playerIdToDelete) => {
    const match = matches[currentMatchId];
    if(!match) return;

    // SİLME YETKİSİ KONTROLÜ
    // 1. Kurucu herkesi silebilir (kendisi hariç, onu ayrı yapalım veya izin verelim)
    // 2. Normal oyuncu SADECE kendini silebilir.
    
    if (userRole === 'guest') return; // Misafir silemez
    if (userRole === 'player' && myPlayerId !== playerIdToDelete) {
        alert("Sadece kendi ismini silebilirsin!");
        return;
    }

    const updatedPlayers = match.players.filter((p) => p.id !== playerIdToDelete);
    saveToFirebase(currentMatchId, { ...match, players: updatedPlayers });

    // Eğer kendini sildiyse rolünü düşür
    if (myPlayerId === playerIdToDelete) {
        localStorage.removeItem(`halisaha_player_${currentMatchId}`);
        if (userRole !== 'creator') setUserRole('guest');
        setMyPlayerId(null);
    }
  };

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- TASARIMLAR ---

  // 1. ANA SAYFA
  if (view === 'home') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-10 text-center border-4 border-green-500/30">
          <div className="flex justify-center mb-6">
            <div className="p-5 bg-green-600 text-white rounded-full shadow-lg ring-4 ring-green-200">
                <Trophy size={48} />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-800 mb-4 tracking-tight">Halı Saha Asistanı</h1>
          <p className="text-xl text-gray-600 mb-10">Profesyonel maç organizasyonu. Kadronu kur, sahaları fethet!</p>
          
          <button 
            onClick={() => setView('create')} 
            className="w-full sm:w-auto px-12 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white py-5 rounded-2xl font-bold text-xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3 mx-auto"
          >
            <PlusCircle size={28} /> Yeni Maç Oluştur
          </button>
          
          <div className="mt-12 pt-6 border-t border-gray-200 text-gray-400 text-sm">
            <span className="flex items-center justify-center gap-2">
               Ugrem tarafından oluşturuldu <span className="text-green-500">●</span> v2.0
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2. MAÇ OLUŞTURMA
  if (view === 'create') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 border-t-8 border-green-600">
          <div className="flex items-center mb-8">
             <button onClick={goToHome} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                <ArrowLeft size={24} className="text-gray-700"/>
             </button>
             <h2 className="text-3xl font-bold text-gray-800 w-full text-center pr-12">Maç Planla</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                  <label className="text-sm font-bold text-gray-600 uppercase tracking-wide">Organizator (Sen)</label>
                  <input className="w-full bg-gray-50 border-2 border-gray-200 p-4 rounded-xl focus:border-green-500 focus:bg-white transition-all outline-none font-bold text-lg" placeholder="İsminiz..." value={newMatch.creator} onChange={e=>setNewMatch({...newMatch, creator: e.target.value})} />
                  
                  <label className="text-sm font-bold text-gray-600 uppercase tracking-wide flex items-center gap-2"><MapPin size={16}/> Saha Adı</label>
                  <input className="w-full bg-gray-50 border-2 border-gray-200 p-4 rounded-xl focus:border-green-500 focus:bg-white transition-all outline-none font-medium" placeholder="Örn: Haliç Spor Tesisleri" value={newMatch.location} onChange={e=>setNewMatch({...newMatch, location: e.target.value})} />
              </div>

              <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-bold text-gray-600 uppercase tracking-wide block mb-1">Tarih</label>
                        <input type="date" className="w-full bg-gray-50 border-2 border-gray-200 p-4 rounded-xl focus:border-green-500 transition-all outline-none font-medium" value={newMatch.date} onChange={e=>setNewMatch({...newMatch, date: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-600 uppercase tracking-wide block mb-1">Saat</label>
                        <input type="time" className="w-full bg-gray-50 border-2 border-gray-200 p-4 rounded-xl focus:border-green-500 transition-all outline-none font-medium" value={newMatch.time} onChange={e=>setNewMatch({...newMatch, time: e.target.value})} />
                      </div>
                  </div>
                  <div>
                     <label className="text-sm font-bold text-gray-600 uppercase tracking-wide block mb-1">Kapasite</label>
                     <select className="w-full bg-gray-50 border-2 border-gray-200 p-4 rounded-xl focus:border-green-500 transition-all outline-none font-medium" value={newMatch.capacity} onChange={e=>setNewMatch({...newMatch, capacity: Number(e.target.value)})}>
                        {[10, 12, 14, 16, 18, 20, 22, 24].map(num => (
                            <option key={num} value={num}>{num} Kişi</option>
                        ))}
                     </select>
                  </div>
              </div>
          </div>

          <button onClick={createMatch} className="w-full mt-8 bg-green-600 hover:bg-green-700 text-white py-5 rounded-2xl font-bold text-xl shadow-lg transition-all flex justify-center items-center gap-3">
              <Check size={28} /> Maçı Oluştur
          </button>
        </div>
      </div>
    );
  }

  // 3. MAÇ DETAY (BİLGİSAYAR EKRANI İÇİN GENİŞ)
  const m = matches[currentMatchId];
  if (!m) return <div className="min-h-screen flex items-center justify-center text-white font-bold text-2xl animate-pulse">Yükleniyor...</div>;

  const playerCount = m.players?.length || 0;
  const isFull = playerCount >= m.capacity;

  return (
    <div className="min-h-screen p-4 md:p-10 flex flex-col items-center">
      
      {/* GERİ SAYIM KARTI */}
      {countdown && (
        <div className="w-full max-w-4xl bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-2xl shadow-lg mb-6 text-center font-bold text-lg md:text-2xl animate-bounce-slow flex items-center justify-center gap-3">
            <Clock size={28} /> {countdown}
        </div>
      )}

      <div className="w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border-t-8 border-green-500">
        {/* ÜST BİLGİ */}
        <div className="bg-gray-50 p-6 md:p-8 border-b border-gray-200 relative">
          <button onClick={goToHome} className="absolute left-6 top-6 bg-white border border-gray-300 hover:bg-gray-100 px-4 py-2 rounded-xl text-gray-700 font-medium transition-all flex items-center gap-2">
            <ArrowLeft size={18} /> <span className="hidden md:inline">Ana Sayfa</span>
          </button>
          
          <div className="text-center mt-4 md:mt-0">
              <h2 className="text-3xl md:text-4xl font-black text-gray-800 mb-2">{m.location}</h2>
              <div className="flex flex-wrap justify-center gap-3 text-gray-600 font-medium text-lg">
                <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border"><Calendar size={18} className="text-green-600"/> {new Date(m.date).toLocaleDateString('tr-TR', {day:'numeric', month:'long', weekday:'long'})}</span>
                <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border"><Clock size={18} className="text-green-600"/> {m.time}</span>
                <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border"><ShieldAlert size={18} className="text-green-600"/> {userRole === 'creator' ? 'Yönetici (Sen)' : 'Oyuncu'}</span>
              </div>
          </div>

          <div className="absolute right-6 top-6 hidden md:block">
             <button onClick={copyLink} className="bg-green-100 hover:bg-green-200 text-green-800 px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all">
                {copied ? <Check size={20}/> : <Copy size={20}/>} {copied ? 'Kopyalandı' : 'Davet Et'}
             </button>
          </div>
        </div>

        <div className="p-6 md:p-10">
          {/* EKLEME ALANI */}
          {!isFull && userRole !== 'player' ? (
            <div className="flex gap-4 mb-8">
                <input 
                    className="flex-1 border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none p-5 rounded-2xl transition-all font-bold text-lg shadow-inner" 
                    placeholder="Adın Soyadın..." 
                    value={playerName} 
                    onChange={e=>setPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                />
                <button onClick={addPlayer} disabled={!playerName.trim()} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 text-white px-8 md:px-12 rounded-2xl font-bold text-xl shadow-lg transition-all active:scale-95 flex items-center gap-2">
                    <PlusCircle size={24}/> Ekle
                </button>
            </div>
          ) : isFull ? (
            <div className="mb-8 p-6 bg-red-50 border-2 border-red-100 text-red-600 rounded-2xl text-center font-bold text-xl flex items-center justify-center gap-3">
                <Trophy size={28}/> Kadro Tamamlandı! Maça Hazırız.
            </div>
          ) : (
            <div className="mb-8 p-6 bg-blue-50 border-2 border-blue-100 text-blue-600 rounded-2xl text-center font-bold text-lg">
                ✅ Kaydın alındı! Bir değişiklik yapmak istersen kendi ismini silip tekrar ekleyebilirsin.
            </div>
          )}

          {/* KADRO LİSTESİ */}
          <div className="flex justify-between items-end mb-4 px-2">
            <h3 className="font-bold text-gray-800 text-xl flex items-center gap-2"><Users size={24} className="text-green-600"/> Kadro</h3>
            <span className="font-bold text-lg text-gray-500">{playerCount} / {m.capacity}</span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {m.players?.map((p, i) => {
              // Silme butonu gösterme kuralı:
              // 1. Kurucu ise: Herkesi görebilir (p.isCreator değilse silebilir, isCreator ise silemez)
              // 2. Oyuncu ise: Sadece kendi ID'si tutuyorsa görebilir.
              const canDelete = (userRole === 'creator' && !p.isCreator) || (userRole === 'player' && p.id === myPlayerId);

              return (
                <div key={i} className={`flex justify-between items-center p-4 rounded-xl border-2 transition-all group ${p.id === myPlayerId ? 'bg-green-50 border-green-200 shadow-md' : 'bg-white border-gray-100 hover:border-green-200'}`}>
                    <div className="flex items-center gap-4">
                        <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black shadow-sm ${p.isCreator ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 text-gray-600'}`}>
                            {i+1}
                        </span>
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                {p.name}
                                {p.isCreator && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-md border border-yellow-200">👑 Org.</span>}
                                {p.id === myPlayerId && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-md border border-green-200">Sen</span>}
                            </span>
                            <span className="text-xs text-gray-400 font-medium">{p.time}</span>
                        </div>
                    </div>
                    
                    {canDelete && (
                        <button onClick={()=>removePlayer(p.id)} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-3 rounded-xl transition-all" title="Sil / Düzenle">
                            <Trash2 size={20}/>
                        </button>
                    )}
                </div>
              );
            })}
          </div>
          
          {(!m.players || m.players.length === 0) && (
             <div className="text-center py-16 text-gray-400 border-3 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                <Users size={48} className="mx-auto mb-4 opacity-30"/>
                <p className="text-xl font-medium">Henüz kimse sahaya çıkmadı.</p>
                <p>İlk sen ol, takımı ateşle!</p>
             </div>
          )}
        </div>
        
        {/* FOOTER */}
        <div className="bg-gray-50 p-4 text-center border-t border-gray-200">
            <p className="text-gray-400 text-sm font-medium">Ugrem tarafından oluşturuldu</p>
        </div>
      </div>
    </div>
  );
}