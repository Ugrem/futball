// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, Trash2, Copy, Check, Trophy, PlusCircle, ArrowLeft, MapPin } from 'lucide-react';
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
  const [view, setView] = useState('home'); // 'home', 'create', 'match'
  const [matches, setMatches] = useState({});
  const [currentMatchId, setCurrentMatchId] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Yeni maç formu verileri
  const [newMatch, setNewMatch] = useState({
    creator: '', date: '', time: '', location: 'Haliç Spor Merkezi', capacity: 14
  });
  // Oyuncu ekleme inputu
  const [playerName, setPlayerName] = useState('');
  // Link ile gelip gelmediğini kontrol et
  const [isViaLink, setIsViaLink] = useState(false);

  // 1. BAŞLANGIÇ KONTROLÜ (Linkle mi geldi?)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get('match');
    if (matchId) {
      setCurrentMatchId(matchId);
      setView('match');
      setIsViaLink(true); // Link ile geldiğini işaretle
    }
  }, []);

  // 2. VERİLERİ ÇEK (Veritabanını dinle)
  useEffect(() => {
    const matchesRef = ref(db, 'matches');
    onValue(matchesRef, (snapshot) => {
      const data = snapshot.val();
      setMatches(data || {});
    });
  }, []);

  // --- YARDIMCI FONKSİYONLAR ---
  const saveToFirebase = (matchId, data) => {
    set(ref(db, 'matches/' + matchId), data);
  };

  const goToHome = () => {
    // Linki temizle ve ana sayfaya dön
    window.history.pushState({}, '', window.location.pathname);
    setCurrentMatchId(null);
    setView('home');
    setIsViaLink(false);
  };

  // --- MAÇ OLUŞTURMA ---
  const createMatch = () => {
    if (!newMatch.creator || !newMatch.date || !newMatch.time) {
      alert('Lütfen kurucu adı, tarih ve saati doldurun!');
      return;
    }
    const matchId = Date.now().toString(36); 
    const matchData = {
      id: matchId,
      ...newMatch,
      createdAt: new Date().toISOString(),
      players: [{ 
        name: newMatch.creator, 
        isCreator: true, 
        time: new Date().toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'}) 
      }]
    };

    saveToFirebase(matchId, matchData);
    setCurrentMatchId(matchId);
    window.history.pushState({}, '', `?match=${matchId}`);
    setView('match');
    // Formu sıfırla
    setNewMatch({ creator: '', date: '', time: '', location: 'Haliç Spor Merkezi', capacity: 14 });
    setIsViaLink(false); // Kendi oluşturduğu için link modu değil
  };

  // --- OYUNCU İŞLEMLERİ ---
  const addPlayer = () => {
    if (!playerName.trim()) return;
    const match = matches[currentMatchId];
    if (!match) return;
    
    if (match.players && match.players.length >= match.capacity) { 
        alert('Kadro Dolu! Başka oyuncu eklenemez.'); return; 
    }
    const currentPlayers = match.players || [];
    // Aynı isim kontrolü (büyük/küçük harf duyarsız)
    if (currentPlayers.some((p) => p.name.trim().toLocaleLowerCase('tr-TR') === playerName.trim().toLocaleLowerCase('tr-TR'))) { 
        alert('Bu isim zaten kadroda var!'); return; 
    }

    const updatedPlayers = [...currentPlayers, { 
        name: playerName.trim(), 
        isCreator: false, 
        time: new Date().toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'}) 
    }];
    
    saveToFirebase(currentMatchId, { ...match, players: updatedPlayers });
    setPlayerName('');
  };

  const removePlayer = (index) => {
    const match = matches[currentMatchId];
    if(!match) return;
    // Kurucuyu silmeyi engelle (isteğe bağlı, şu an açık)
    const updatedPlayers = match.players.filter((_, i) => i !== index);
    saveToFirebase(currentMatchId, { ...match, players: updatedPlayers });
  };

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- GÖRÜNÜMLER (VIEWS) ---

  // 1. ANA SAYFA (TEMİZ GÖRÜNÜM - Madde 1 ve 2)
  if (view === 'home') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 backdrop-blur-sm">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 text-center border border-green-100">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-green-600 text-white rounded-full shadow-lg shadow-green-200">
                <Trophy size={40} strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Halı Saha Asistanı</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">Maçını planla, kadronu kur, linki paylaş. Gerisini bize bırak!</p>
          
          <button 
            onClick={() => setView('create')} 
            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white py-5 rounded-xl font-bold text-xl mb-4 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
          >
            <PlusCircle size={24} /> Yeni Maç Oluştur
          </button>
          
          <p className="text-xs text-gray-400 mt-6">
            Bir maça katılmak için size gönderilen linki kullanın.
          </p>
        </div>
      </div>
    );
  }

  // 2. MAÇ OLUŞTURMA EKRANI
  if (view === 'create') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-green-100">
          <div className="flex items-center mb-6 relative">
             <button onClick={goToHome} className="absolute left-0 p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft size={20}/>
             </button>
             <h2 className="text-xl font-bold text-gray-800 w-full text-center">Maç Detayları</h2>
          </div>
          
          <div className="space-y-4">
              <div>
                  <label className="text-sm font-semibold text-gray-700 ml-1">Kurucu (Senin Adın)</label>
                  <input className="w-full border-2 border-gray-200 p-3 rounded-xl mt-1 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none font-medium" placeholder="Adını yaz" value={newMatch.creator} onChange={e=>setNewMatch({...newMatch, creator: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 ml-1 flex items-center gap-1"><Calendar size={14}/> Tarih</label>
                    <input type="date" className="w-full border-2 border-gray-200 p-3 rounded-xl mt-1 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none font-medium text-gray-700" value={newMatch.date} onChange={e=>setNewMatch({...newMatch, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 ml-1 flex items-center gap-1"><Clock size={14}/> Saat</label>
                    <input type="time" className="w-full border-2 border-gray-200 p-3 rounded-xl mt-1 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none font-medium text-gray-700" value={newMatch.time} onChange={e=>setNewMatch({...newMatch, time: e.target.value})} />
                  </div>
              </div>
              <div>
                  <label className="text-sm font-semibold text-gray-700 ml-1 flex items-center gap-1"><MapPin size={14}/> Saha Adı</label>
                  <input className="w-full border-2 border-gray-200 p-3 rounded-xl mt-1 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none font-medium" placeholder="Örn: Haliç Spor Tesisleri" value={newMatch.location} onChange={e=>setNewMatch({...newMatch, location: e.target.value})} />
              </div>
              <div>
                 <label className="text-sm font-semibold text-gray-700 ml-1 flex items-center gap-1"><Users size={14}/> Kişi Kapasitesi</label>
                 <select className="w-full border-2 border-gray-200 p-3 rounded-xl mt-1 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none font-medium bg-white" value={newMatch.capacity} onChange={e=>setNewMatch({...newMatch, capacity: Number(e.target.value)})}>
                    {[10, 12, 14, 16, 18, 20, 22, 24].map(num => (
                        <option key={num} value={num}>{num} Kişi</option>
                    ))}
                 </select>
              </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button onClick={goToHome} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-xl font-bold transition-colors">İptal</button>
            <button onClick={createMatch} className="flex-[2] bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-bold shadow-lg transition-colors flex justify-center items-center gap-2">
                <Check size={20} /> Oluştur
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. MAÇ DETAY SAYFASI (Linkle gelinen yer)
  const m = matches[currentMatchId];
  if (!m) return <div className="min-h-screen flex items-center justify-center text-green-600 font-bold text-lg animate-pulse">Maç verisi yükleniyor...</div>;

  const playerCount = m.players?.length || 0;
  const isFull = playerCount >= m.capacity;

  return (
    <div className="min-h-screen p-4 flex flex-col items-center backdrop-blur-sm">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-green-100 my-auto">
        {/* Üst Bilgi Kartı */}
        <div className="bg-gradient-to-br from-green-700 via-green-600 to-green-500 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          
          {/* Geri Butonu: Sadece temiz ana sayfaya döner */}
          <button onClick={goToHome} className="absolute left-4 top-4 bg-white/20 hover:bg-white/30 p-2 rounded-full text-white transition-all backdrop-blur-sm z-10">
            <ArrowLeft size={18} />
          </button>
          
          <h2 className="text-2xl font-extrabold mt-1 relative z-10 shadow-sm">{m.location}</h2>
          <div className="opacity-95 mt-3 flex flex-col gap-1 justify-center items-center text-sm font-medium relative z-10">
            <p className="flex items-center gap-2 bg-green-800/30 px-3 py-1 rounded-full"><Calendar size={14}/> {new Date(m.date).toLocaleDateString('tr-TR', {day:'numeric', month:'long', year:'numeric', weekday:'long'})}</p>
            <p className="flex items-center gap-2 bg-green-800/30 px-3 py-1 rounded-full mt-1"><Clock size={14}/> {m.time}</p>
          </div>

          <div className="mt-6 flex justify-center relative z-10">
              <span className={`px-5 py-2 rounded-full text-sm font-bold shadow-md flex items-center gap-2 backdrop-blur-md border-2 ${isFull ? 'bg-red-500 border-red-400 text-white' : 'bg-white border-green-200 text-green-800'}`}>
                <Users size={16}/> {playerCount} / {m.capacity} Kişi {isFull && '(Dolu)'}
              </span>
          </div>

          <button onClick={copyLink} className="mt-5 bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-full text-sm font-bold flex items-center justify-center gap-2 mx-auto transition-all backdrop-blur-md border border-white/30 relative z-10 active:scale-95">
            {copied ? <Check size={16} className="text-green-200"/> : <Copy size={16}/>} {copied ? 'Link Kopyalandı!' : 'Davet Linkini Kopyala'}
          </button>
        </div>

        <div className="p-6">
          {/* Oyuncu Ekleme Alanı */}
          {!isFull ? (
            <div className="flex gap-2 mb-6">
                <input 
                    className="flex-1 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none p-3.5 rounded-xl transition-all font-medium shadow-sm" 
                    placeholder="Adın Soyadın..." 
                    value={playerName} 
                    onChange={e=>setPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                />
                <button onClick={addPlayer} disabled={!playerName.trim()} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 text-white px-6 rounded-xl font-bold shadow-md transition-all active:scale-95 flex items-center">
                    <PlusCircle size={20} className="mr-1"/> Ekle
                </button>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-center font-bold flex items-center justify-center gap-2">
                <Trophy size={18} className="text-red-500"/> Kadro Tamamlandı!
            </div>
          )}

          <div className="mb-3 flex justify-between items-end border-b pb-2">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><Users size={18} className="text-green-600"/> Kadro</h3>
          </div>

          {/* Oyuncu Listesi */}
          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
            {m.players?.map((p, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-white border-2 border-gray-100 rounded-xl hover:border-green-200 hover:shadow-sm transition-all group">
                <div className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-green-100 text-green-700 border border-green-200 rounded-full flex items-center justify-center text-sm font-black shadow-sm">{i+1}</span>
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-800 flex items-center gap-2">
                            {p.name}
                            {p.isCreator && <span className="text-[10px] bg-yellow-100 text-yellow-800 border border-yellow-200 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5">👑 Kurucu</span>}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Clock size={10}/> {p.time}</span>
                    </div>
                </div>
                <button onClick={()=>removePlayer(i)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all md:opacity-0 group-hover:opacity-100 active:scale-90">
                    <Trash2 size={18}/>
                </button>
              </div>
            ))}
            {(!m.players || m.players.length === 0) && (
                <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 flex flex-col items-center justify-center gap-2">
                    <Users size={32} className="opacity-50"/>
                    <p>Henüz kimse kayıt olmadı.</p>
                    <p className="text-sm">İlk sen ol!</p>
                </div>
            )}
          </div>
        </div>
      </div>
      {/* Alt Bilgi */}
      <p className="text-center text-green-800/60 text-xs mt-4 font-medium flex items-center justify-center gap-1">
        <Trophy size={12}/> Halı Saha Asistanı ile oluşturuldu
      </p>
    </div>
  );
}