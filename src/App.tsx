// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, Trash2, Copy, Check } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';

// --- AYARLAR ---
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
  const [newMatch, setNewMatch] = useState({
    creator: '', date: '', time: '', location: 'Haliç Spor Merkezi', capacity: 14
  });
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get('match');
    if (matchId) {
      setCurrentMatchId(matchId);
      setView('match');
    }
  }, []);

  useEffect(() => {
    const matchesRef = ref(db, 'matches');
    onValue(matchesRef, (snapshot) => {
      const data = snapshot.val();
      setMatches(data || {});
    });
  }, []);

  const saveToFirebase = (matchId, data) => {
    set(ref(db, 'matches/' + matchId), data);
  };

  const createMatch = () => {
    if (!newMatch.creator || !newMatch.date || !newMatch.time) {
      alert('Lütfen eksik bilgileri doldurun!');
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
    setNewMatch({ creator: '', date: '', time: '', location: 'Haliç Spor Merkezi', capacity: 14 });
  };

  const addPlayer = () => {
    if (!playerName.trim()) return;
    const match = matches[currentMatchId];
    if (!match) return;
    
    if (match.players && match.players.length >= match.capacity) { 
        alert('Kontenjan dolu!'); return; 
    }
    const currentPlayers = match.players || [];
    if (currentPlayers.some((p) => p.name.toLowerCase() === playerName.trim().toLowerCase())) { 
        alert('Bu isimle zaten kayıt var!'); return; 
    }

    const updatedPlayers = [...currentPlayers, { 
        name: playerName, 
        isCreator: false, 
        time: new Date().toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'}) 
    }];
    
    saveToFirebase(currentMatchId, { ...match, players: updatedPlayers });
    setPlayerName('');
  };

  const removePlayer = (index) => {
    const match = matches[currentMatchId];
    if(!match) return;
    const updatedPlayers = match.players.filter((_, i) => i !== index);
    saveToFirebase(currentMatchId, { ...match, players: updatedPlayers });
  };

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (view === 'home') {
    return (
      <div className="p-4 min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="inline-block p-3 bg-green-100 rounded-full mb-2">
                <Users className="text-green-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Halı Saha Listesi</h1>
          </div>
          
          <button onClick={() => setView('create')} className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg mb-6 shadow-md transition-all">
            + Yeni Maç Oluştur
          </button>
          
          <h3 className="font-bold text-gray-700 mb-3 border-b pb-2">Aktif Maçlar</h3>
          <div className="space-y-3">
            {Object.values(matches).length === 0 && <p className="text-gray-400 text-center">Henüz maç yok.</p>}
            {Object.values(matches).map((m) => (
              <div key={m.id} onClick={() => {setCurrentMatchId(m.id); setView('match'); window.history.pushState({}, '', `?match=${m.id}`);}} 
                   className="border border-gray-200 p-4 rounded-xl cursor-pointer hover:bg-green-50 hover:border-green-300 transition-all bg-white shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="font-bold text-gray-800 text-lg">{new Date(m.date).toLocaleDateString('tr-TR', {day:'numeric', month:'long'})}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-1"><Clock size={14}/> {m.time}</div>
                        <div className="text-xs text-gray-500 mt-1">{m.location}</div>
                    </div>
                    <div className="text-right">
                        <span className="bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full text-sm">
                            {m.players?.length || 0}/{m.capacity}
                        </span>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="p-4 min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6 text-center">Maç Detayları</h2>
          <div className="space-y-4">
              <div>
                  <label className="text-sm font-semibold text-gray-600">Senin Adın</label>
                  <input className="w-full border p-3 rounded-lg mt-1" placeholder="Adını yaz" value={newMatch.creator} onChange={e=>setNewMatch({...newMatch, creator: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Tarih</label>
                    <input type="date" className="w-full border p-3 rounded-lg mt-1" value={newMatch.date} onChange={e=>setNewMatch({...newMatch, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Saat</label>
                    <input className="w-full border p-3 rounded-lg mt-1" placeholder="21:00" value={newMatch.time} onChange={e=>setNewMatch({...newMatch, time: e.target.value})} />
                  </div>
              </div>
              <div>
                  <label className="text-sm font-semibold text-gray-600">Saha Adı</label>
                  <input className="w-full border p-3 rounded-lg mt-1" placeholder="Örn: Haliç Spor Tesisleri" value={newMatch.location} onChange={e=>setNewMatch({...newMatch, location: e.target.value})} />
              </div>
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={()=>setView('home')} className="flex-1 bg-gray-200 hover:bg-gray-300 py-3 rounded-lg font-medium transition-colors">İptal</button>
            <button onClick={createMatch} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-md transition-colors">Oluştur</button>
          </div>
        </div>
      </div>
    );
  }

  const m = matches[currentMatchId];
  if (!m) return <div className="p-10 text-center text-gray-500">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-green-500 p-6 text-white text-center relative">
          <button onClick={()=>setView('home')} className="absolute left-4 top-4 text-white/80 hover:text-white text-xs">← Geri</button>
          <h2 className="text-xl font-bold mt-2">{m.location}</h2>
          <p className="opacity-90 mt-1 flex justify-center items-center gap-2">
            <Calendar size={16}/> {new Date(m.date).toLocaleDateString('tr-TR', {day:'numeric', month:'long'})} 
            <span className="opacity-50">|</span> 
            <Clock size={16}/> {m.time}
          </p>
          <button onClick={copyLink} className="mt-4 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm flex items-center justify-center gap-2 mx-auto transition-all backdrop-blur-sm">
            {copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? 'Kopyalandı!' : 'Linki Paylaş'}
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-2 mb-6">
            <input 
                className="flex-1 border-2 border-gray-200 focus:border-green-500 outline-none p-3 rounded-xl transition-all" 
                placeholder="Adın Soyadın" 
                value={playerName} 
                onChange={e=>setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
            />
            <button onClick={addPlayer} className="bg-green-600 hover:bg-green-700 text-white px-6 rounded-xl font-bold shadow-md transition-colors">Ekle</button>
          </div>

          <div className="mb-2 flex justify-between items-end">
            <h3 className="font-bold text-gray-700">Kadro</h3>
            <span className="text-sm text-gray-500">{m.players?.length || 0} / {m.capacity} Kişi</span>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {m.players?.map((p, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:shadow-sm transition-all group">
                <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-green-200 text-green-800 rounded-full flex items-center justify-center text-xs font-bold">{i+1}</span>
                    <div>
                        <span className="font-semibold text-gray-800">{p.name}</span>
                        {p.isCreator && <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Kurucu</span>}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{p.time}</span>
                    <button onClick={()=>removePlayer(i)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1">
                        <Trash2 size={18}/>
                    </button>
                </div>
              </div>
            ))}
            {(!m.players || m.players.length === 0) && (
                <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-xl">Henüz kimse kayıt olmadı</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}