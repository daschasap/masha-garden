import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

// --- НАСТРОЙКИ SUPABASE ---
const SUPABASE_URL = 'https://mroimmkxtamxutwdtwnc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yb2ltbWt4dGFteHV0d2R0d25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczODU2MzYsImV4cCI6MjA5Mjk2MTYzNn0.M5HppKc_tn2ptoprvrehs0Hh9tJcW3uiIG8ZKSPo7SA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const USER_ID = localStorage.getItem('garden_user_id') || Math.random().toString(36).substring(7);
localStorage.setItem('garden_user_id', USER_ID);

function App() {
  const [memories, setMemories] = useState([]);
  const [archiveMedia, setArchiveMedia] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [selectedFlower, setSelectedFlower] = useState(null);
  const [fullScreenMedia, setFullScreenMedia] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Проверка на админа через ссылку (?admin=true)
  const isAdmin = window.location.search.includes('admin=true');

  const playlist = [
    { id: 1, name: 'Трек 1', file: '/track1.mp3', icon: '🍃' },
    { id: 2, name: 'Трек 2', file: '/track2.mp3', icon: '✨' },
    { id: 3, name: 'Трек 3', file: '/track3.mp3', icon: '☀️' },
  ];

  useEffect(() => {
    fetchMemories();
    fetchArchive();
  }, []);

  async function fetchMemories() {
    const { data } = await supabase.from('memories').select('*');
    if (data) setMemories(data);
  }

  async function fetchArchive() {
    const { data } = await supabase.storage.from('garden-media').list();
    if (data) {
      const urls = data.map(file => ({
        id: file.id,
        name: file.name,
        url: supabase.storage.from('garden-media').getPublicUrl(file.name).data.publicUrl,
        type: file.name.match(/\.(mp4|mov|webm)$/i) ? 'video' : 'image'
      }));
      setArchiveMedia(urls);
    }
  }

  const deleteMemory = async (id) => {
    if (!confirm("Удалить это пожелание?")) return;
    const { error } = await supabase.from('memories').delete().eq('id', id);
    if (!error) {
      setMemories(prev => prev.filter(m => m.id !== id));
      setSelectedFlower(null);
    } else {
      alert("Ошибка: " + error.message);
    }
  };

  const deleteFile = async (fileName) => {
    if (!confirm("Удалить этот файл из шкатулки?")) return;
    const { error } = await supabase.storage.from('garden-media').remove([fileName]);
    if (!error) fetchArchive();
  };

  const addMemory = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newMsg = {
      author_id: USER_ID,
      name: formData.get('name'),
      text: formData.get('text'),
      x: Math.floor(Math.random() * 80) + 10,
      y: Math.floor(Math.random() * 40) + 20
    };
    const { error } = await supabase.from('memories').insert([newMsg]);
    if (!error) { fetchMemories(); setShowForm(false); e.target.reset(); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('garden-media').upload(fileName, file);
    if (!error) fetchArchive();
    setUploading(false);
  };

  const togglePlay = (track) => {
    if (currentTrack?.id === track.id) {
      isPlaying ? audioRef.current.pause() : audioRef.current.play();
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      setTimeout(() => audioRef.current.play(), 150);
    }
  };

  return (
    <div className="garden-bg">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;700&display=swap');
        .garden-bg { min-height: 100vh; background: #fdfaf1; font-family: 'Comfortaa', cursive; color: #4a5d4e; text-align: center; padding: 60px 20px; position: relative; overflow-x: hidden; }
        .title { font-size: 2.5rem; color: #5b7a61; margin-bottom: 20px; }
        .btn-primary { background: #7ca38a; color: white; border: none; padding: 12px 24px; border-radius: 50px; font-weight: bold; cursor: pointer; margin: 10px; transition: 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.1); font-family: inherit; }
        .flower-wrapper { position: absolute; display: flex; flex-direction: column; align-items: center; z-index: 10; cursor: pointer; }
        .flower-card { font-size: 3.5rem; transition: 0.3s; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(74, 93, 78, 0.6); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal { background: white; padding: 30px; border-radius: 30px; width: 100%; max-width: 450px; position: relative; }
        .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; }
        .media-item { border-radius: 15px; overflow: hidden; position: relative; background: #eee; height: 150px; cursor: zoom-in; }
        .media-item img, .media-item video { width: 100%; height: 100%; object-fit: cover; }
        .del-mini { position: absolute; top: 5px; right: 5px; background: white; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; color: #ff5c5c; font-weight: bold; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
      `}</style>

      <audio ref={audioRef} src={currentTrack?.file} loop />

      <header>
        <h1 className="title">Маша, мы будем очень скучать!</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>💌 Написать пожелание</button>
        <button className="btn-primary" style={{ background: '#e9c4a6' }} onClick={() => setShowArchive(true)}>✨ Шкатулка воспоминаний</button>
      </header>

      <main style={{ position: 'relative', minHeight: '60vh' }}>
        {memories.map((m) => (
          <motion.div key={m.id} initial={{ scale: 0 }} animate={{ scale: 1 }} className="flower-wrapper" style={{ left: `${m.x}%`, top: `${m.y}%` }} onClick={() => setSelectedFlower(m)}>
            <div className="flower-card">🌸</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{m.name}</div>
          </motion.div>
        ))}
      </main>

      <div style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 1100, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ background: 'white', padding: '5px 10px', borderRadius: '10px', fontSize: '0.7rem' }}>{isPlaying ? currentTrack.name : 'Музыка'}</div>
        <div style={{ display: 'flex', gap: '5px' }}>
          {playlist.map(t => (
            <button key={t.id} onClick={() => togglePlay(t)} style={{ background: currentTrack?.id === t.id && isPlaying ? '#7ca38a' : 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer' }}>{t.icon}</button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedFlower && (
          <div className="modal-overlay" onClick={() => setSelectedFlower(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="modal" onClick={e => e.stopPropagation()}>
              <h3>От {selectedFlower.name}</h3>
              <p>"{selectedFlower.text}"</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <button className="btn-primary" onClick={() => setSelectedFlower(null)}>Закрыть</button>
                {/* Кнопка удаления только для автора или админа */}
                {(selectedFlower.author_id === USER_ID || isAdmin) && (
                  <button onClick={() => deleteMemory(selectedFlower.id)} style={{ background: 'none', border: '1px solid red', color: 'red', borderRadius: '20px', padding: '5px 15px', cursor: 'pointer' }}>Удалить</button>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {showForm && (
          <div className="modal-overlay">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="modal">
              <h2 style={{ marginBottom: '20px' }}>Написать пожелание</h2>
              <form onSubmit={addMemory}>
                <input name="name" placeholder="Твое имя" required />
                <textarea name="text" placeholder="Пожелание..." rows="4" required />
                <button type="submit" className="btn-primary" style={{ width: '100%', margin: '0' }}>Отправить пожелание</button>
                <button type="button" onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', marginTop: '15px', color: '#999', cursor: 'pointer', width: '100%' }}>Отмена</button>
              </form>
            </motion.div>
          </div>
        )}

        {showArchive && (
          <div className="modal-overlay" style={{ background: '#fdfaf1', display: 'block', overflowY: 'auto' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
              <button onClick={() => setShowArchive(false)} style={{ float: 'right', fontSize: '30px', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
              <h2 className="title">Шкатулка воспоминаний</h2>
              <label className="btn-primary" style={{ display: 'inline-block', marginBottom: '20px' }}>
                {uploading ? "Загрузка..." : "📸 Добавить фото/видео"}
                <input type="file" hidden onChange={handleFileUpload} disabled={uploading} accept="image/*,video/*" />
              </label>
              <div className="media-grid">
                {archiveMedia.map(item => (
                  <div key={item.id} className="media-item">
                    {/* Крестик удаления только для админа */}
                    {isAdmin && <button className="del-mini" onClick={(e) => { e.stopPropagation(); deleteFile(item.name); }}>✕</button>}
                    {item.type === 'image' ? <img src={item.url} onClick={() => setFullScreenMedia(item)} /> : <video src={item.url} onClick={() => setFullScreenMedia(item)} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {fullScreenMedia && (
          <div className="modal-overlay" onClick={() => setFullScreenMedia(null)} style={{ background: 'rgba(0,0,0,0.9)' }}>
            <div style={{ maxWidth: '90%', maxHeight: '90%' }}>
              {fullScreenMedia.type === 'image' ?
                <img src={fullScreenMedia.url} style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '10px' }} /> :
                <video src={fullScreenMedia.url} controls autoPlay style={{ maxWidth: '100%', maxHeight: '80vh' }} />
              }
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;