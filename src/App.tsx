import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  MapPin,
  Clock,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// --- FIREBASE BAĞLANTISI ---
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';

// Senin Proje Bilgilerin (Bunlar olmadan başkası göremez)
const firebaseConfig = {
  apiKey: 'AIzaSyALTHDel3NEmHlZq0q2WhU4p0ACcRHuCuQ',
  authDomain: 'halisaha-5265d.firebaseapp.com',
  projectId: 'halisaha-5265d',
  storageBucket: 'halisaha-5265d.firebasestorage.app',
  messagingSenderId: '709091528292',
  appId: '1:709091528292:web:0ab3cf769818debefa1971',
  measurementId: 'G-P7DZXPEWDB',
  databaseURL: 'https://halisaha-5265d-default-rtdb.firebaseio.com',
};

// Firebase'i Başlat
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function HaliSahaKayit() {
  const [view, setView] = useState('home');
  const [matches, setMatches] = useState({});
  const [currentMatchId, setCurrentMatchId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [expandedPast, setExpandedPast] = useState({});

  const [newMatch, setNewMatch] = useState({
    creator: '',
    date: '',
    time: '',
    location: 'Haliç Spor Merkezi',
    capacity: 14,
  });
  const [playerName, setPlayerName] = useState('');

  // 1. URL KONTROLÜ (Link ile gelen maçı açar)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get('match');
    if (matchId) {
      setCurrentMatchId(matchId);
      setView('match');
    }
  }, []);

  // 2. CANLI VERİ BAĞLANTISI (Database'den herkes için veriyi çeker)
  useEffect(() => {
    const matchesRef = ref(db, 'matches');
    // Veritabanında değişiklik olunca anında burayı günceller
    onValue(matchesRef, (snapshot) => {
      const data = snapshot.val();
      setMatches(data || {});
    });
  }, []);

  // 3. VERİ KAYDETME (Buluta Yazar)
  const saveToFirebase = (matchId, data) => {
    set(ref(db, 'matches/' + matchId), data);
  };

  // --- İŞLEVLER ---

  const createMatch = () => {
    if (!newMatch.creator || !newMatch.date || !newMatch.time) {
      alert('Lütfen tüm bilgileri doldurun');
      return;
    }

    const matchId =
      Date.now().toString(36) + Math.random().toString(36).substr(2);

    const matchData = {
      id: matchId,
      ...newMatch,
      createdAt: new Date().toISOString(),
      players: [
        {
          name: newMatch.creator,
          time: new Date().toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
          isCreator: true,
        },
      ],
      status: 'active',
    };

    saveToFirebase(matchId, matchData);

    setCurrentMatchId(matchId);
    // Tarayıcıdaki linki güncelle
    const url = `${window.location.origin}${window.location.pathname}?match=${matchId}`;
    window.history.pushState({}, '', url);

    setView('match');
    setNewMatch({
      creator: '',
      date: '',
      time: '',
      location: 'Haliç Spor Merkezi',
      capacity: 14,
    });
  };

  const addPlayer = () => {
    if (!playerName.trim()) return;
    const match = matches[currentMatchId];
    if (!match) return;

    if (match.players && match.players.length >= match.capacity) {
      alert('Kontenjan dolu!');
      return;
    }

    const currentPlayers = match.players || [];
    if (
      currentPlayers.some(
        (p) => p.name.toLowerCase() === playerName.trim().toLowerCase()
      )
    ) {
      alert('Bu isimle zaten kayıt var!');
      return;
    }

    const newPlayer = {
      name: playerName.trim(),
      time: new Date().toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      isCreator: false,
    };

    const updatedMatch = { ...match, players: [...currentPlayers, newPlayer] };
    saveToFirebase(currentMatchId, updatedMatch);
    setPlayerName('');
  };

  const removePlayer = (playerIndex) => {
    const match = matches[currentMatchId];
    if (!match) return;
    const updatedMatch = {
      ...match,
      players: match.players.filter((_, index) => index !== playerIndex),
    };
    saveToFirebase(currentMatchId, updatedMatch);
  };

  const copyLink = () => {
    // Linki oluştururken mevcut sayfa adresini kullan
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Yardımcı Fonksiyonlar
  const getCountdown = (dateStr, timeStr) => {
    if (!timeStr || !dateStr) return null;
    const [hours] = timeStr.split('-')[0].split(':');
    const matchDate = new Date(dateStr);
    matchDate.setHours(parseInt(hours || '0'), 0, 0, 0);
    const now = new Date();
    const diff = matchDate - now;
    if (diff < 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days} gün ${hrs} saat`;
    if (hrs > 0) return `${hrs} saat`;
    return 'Çok yakında!';
  };

  const checkMatchStatus = (match) => {
    if (!match.time || !match.date) return 'active';
    const [hours] = match.time.split('-')[0].split(':');
    const matchDate = new Date(match.date);
    matchDate.setHours(parseInt(hours || '0'), 0, 0, 0);
    const now = new Date();
    const isPast = now > matchDate;
    const isFull = match.players && match.players.length >= match.capacity;
    return isPast || isFull ? 'past' : 'active';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['Pazar', 'Pzt', 'Salı', 'Çar', 'Per', 'Cuma', 'Cmt'];
    const months = [
      'Oca',
      'Şub',
      'Mar',
      'Nis',
      'May',
      'Haz',
      'Tem',
      'Ağu',
      'Eyl',
      'Eki',
      'Kas',
      'Ara',
    ];
    return `${days[date.getDay()]}, ${date.getDate()} ${
      months[date.getMonth()]
    } ${date.getFullYear()}`;
  };

  // --- SAYFA TASARIMLARI ---

  // 1. ANA SAYFA
  if (view === 'home') {
    const myMatches = Object.values(matches)
      .filter(
        (m) =>
          (m.players && m.players.some((p) => p.isCreator)) ||
          checkMatchStatus(m) === 'active'
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="text-center">
              <div className="bg-green-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="text-white" size={32} />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Halı Saha Kayıt Sistemi
              </h1>
              <p className="text-gray-600 mb-6">
                Hızlı ve kolay maç organizasyonu
              </p>
              <button
                onClick={() => setView('create')}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                ⚽ Yeni Maç Oluştur
              </button>
            </div>
          </div>

          {myMatches.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Calendar size={24} /> Maçlarım
              </h2>
              {myMatches.map((match) => {
                const status = checkMatchStatus(match);
                const countdown =
                  status === 'active'
                    ? getCountdown(match.date, match.time)
                    : null;
                return (
                  <div
                    key={match.id}
                    onClick={() => {
                      setCurrentMatchId(match.id);
                      window.history.pushState({}, '', `?match=${match.id}`);
                      setView('match');
                    }}
                    className="bg-white rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-800">
                          {formatDate(match.date)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {match.time} • {match.location}
                        </div>
                        {countdown && (
                          <div className="text-green-600 font-semibold text-sm mt-1">
                            🔥 Maça {countdown} kaldı!
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {match.players?.length || 0}/{match.capacity}
                        </div>
                        <div
                          className={`text-xs ${
                            status === 'past'
                              ? 'text-gray-500'
                              : 'text-green-600'
                          }`}
                        >
                          {status === 'past' ? 'Geçmiş' : 'Aktif'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. MAÇ OLUŞTURMA
  if (view === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Yeni Maç Oluştur
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adınız Soyadınız
                </label>
                <input
                  type="text"
                  value={newMatch.creator}
                  onChange={(e) =>
                    setNewMatch({ ...newMatch, creator: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Organizatör adı"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tarih
                </label>
                <input
                  type="date"
                  value={newMatch.date}
                  onChange={(e) =>
                    setNewMatch({ ...newMatch, date: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saat
                </label>
                <input
                  type="text"
                  value={newMatch.time}
                  onChange={(e) =>
                    setNewMatch({ ...newMatch, time: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="örn: 21:00-22:00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yer
                </label>
                <input
                  type="text"
                  value={newMatch.location}
                  onChange={(e) =>
                    setNewMatch({ ...newMatch, location: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kontenjan
                </label>
                <select
                  value={newMatch.capacity}
                  onChange={(e) =>
                    setNewMatch({
                      ...newMatch,
                      capacity: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value={12}>12 Kişi</option>
                  <option value={14}>14 Kişi</option>
                  <option value={16}>16 Kişi</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setView('home')}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-medium transition-all"
                >
                  İptal
                </button>
                <button
                  onClick={createMatch}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-all"
                >
                  Maç Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. MAÇ DETAYI
  const matchObj = matches[currentMatchId];
  if (!matchObj) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">
            Maç yükleniyor veya bulunamadı...
          </p>
          <button
            onClick={() => {
              window.history.pushState({}, '', window.location.pathname);
              setView('home');
            }}
            className="bg-green-500 text-white px-6 py-3 rounded-lg"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  const matchStatus = checkMatchStatus(matchObj);
  const matchCountdown =
    matchStatus === 'active'
      ? getCountdown(matchObj.date, matchObj.time)
      : null;
  const pastMatches = Object.values(matches)
    .filter((m) => m.id !== currentMatchId && checkMatchStatus(m) === 'past')
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl mb-4 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 p-6 text-white">
            {matchCountdown && (
              <div className="text-center mb-4 bg-white bg-opacity-20 rounded-xl p-3">
                <div className="text-2xl font-bold">
                  🔥 Maça {matchCountdown} kaldı!
                </div>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Calendar size={22} /> <span>{formatDate(matchObj.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={20} /> <span>{matchObj.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={20} /> <span>{matchObj.location}</span>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center pt-4 border-t border-white border-opacity-30">
              <div>
                <div className="text-3xl font-bold">
                  {matchObj.players?.length || 0}/{matchObj.capacity}
                </div>
                <div className="text-sm opacity-90">Kayıtlı</div>
              </div>
              <button
                onClick={copyLink}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg flex items-center gap-2"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Kopyalandı!' : 'Link Kopyala'}
              </button>
            </div>
          </div>

          {/* Kayıt Formu */}
          {matchStatus === 'active' && (
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Adınız Soyadınız"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  disabled={
                    matchObj.players &&
                    matchObj.players.length >= matchObj.capacity
                  }
                />
                <button
                  onClick={addPlayer}
                  disabled={
                    matchObj.players &&
                    matchObj.players.length >= matchObj.capacity
                  }
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-all"
                >
                  Kayıt Ol
                </button>
              </div>
              {matchObj.players &&
                matchObj.players.length >= matchObj.capacity && (
                  <div className="mt-3 text-center text-red-600 font-medium bg-red-50 p-3 rounded-lg">
                    🔴 Kontenjan Dolu!
                  </div>
                )}
            </div>
          )}

          {/* Oyuncu Listesi */}
          <div className="p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={20} /> Kayıtlı Oyuncular
            </h3>
            <div className="space-y-2">
              {matchObj.players &&
                matchObj.players.map((player, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-md">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 flex items-center gap-2">
                          {player.name}{' '}
                          {player.isCreator && (
                            <span className="text-yellow-500">👑</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {player.time}
                        </div>
                      </div>
                    </div>
                    {matchStatus === 'active' && (
                      <button
                        onClick={() => removePlayer(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Önceki Maçlar */}
        {pastMatches.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock size={20} /> Önceki Maçlar
            </h3>
            <div className="space-y-3">
              {pastMatches.map((pastMatch) => (
                <div
                  key={pastMatch.id}
                  className="border border-gray-200 rounded-xl overflow-hidden"
                >
                  <div
                    onClick={() =>
                      setExpandedPast((prev) => ({
                        ...prev,
                        [pastMatch.id]: !prev[pastMatch.id],
                      }))
                    }
                    className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer hover:bg-gray-100"
                  >
                    <div>
                      <div className="font-semibold text-gray-800">
                        {formatDate(pastMatch.date)} - {pastMatch.location}
                      </div>
                      <div className="text-sm text-gray-600">
                        {pastMatch.time} • {pastMatch.players?.length || 0} kişi
                      </div>
                    </div>
                    {expandedPast[pastMatch.id] ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </div>
                  {expandedPast[pastMatch.id] && (
                    <div className="p-4 bg-white">
                      <div className="grid grid-cols-2 gap-2">
                        {pastMatch.players?.map((player, idx) => (
                          <div
                            key={idx}
                            className="text-sm bg-gray-50 p-2 rounded flex items-center gap-2"
                          >
                            <span className="font-bold text-gray-500">
                              {idx + 1}.
                            </span>
                            <span className="text-gray-800">{player.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
