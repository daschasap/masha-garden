const SUPABASE_URL = 'https://mroimmkxtamxutwdtwnc.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yb2ltbWt4dGFteHV0d2R0d25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczODU2MzYsImV4cCI6MjA5Mjk2MTYzNn0.M5HppKc_tn2ptoprvrehs0Hh9tJcW3uiIG8ZKSPo7SA';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Генерируем ID пользователя, чтобы отличать свои сообщения
const USER_ID = localStorage.getItem('garden_user_id') || Math.random().toString(36).substring(7);
localStorage.setItem('garden_user_id', USER_ID);

function App() {
  const [memories, setMemories] = useState([]);
  const [archiveMedia, setArchiveMedia] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [selectedFlower, setSelectedFlower] = useState(null);
  const [fullScreenMedia, setFullScreenMedia] = useState(null); // Для зума фото/видео

  useEffect(() => {
    const m = localStorage.getItem('masha_memories');
    const a = localStorage.getItem('masha_archive');
    if (m) setMemories(JSON.parse(m));
    if (a) setArchiveMedia(JSON.parse(a));
  }, []);

  useEffect(() => {
    localStorage.setItem('masha_memories', JSON.stringify(memories));
    localStorage.setItem('masha_archive', JSON.stringify(archiveMedia));
  }, [memories, archiveMedia]);

  const addMemory = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setMemories([...memories, {
      id: Date.now(),
      authorId: USER_ID, // Привязываем сообщение к автору
      name: formData.get('name'),
      text: formData.get('text'),
      x: Math.floor(Math.random() * 80) + 10,
      y: Math.floor(Math.random() * 40) + 20
    }]);
    setShowForm(false);
    e.target.reset();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setArchiveMedia([...archiveMedia, {
        id: Date.now(),
        authorId: USER_ID,
        type: file.type.startsWith('video') ? 'video' : 'image',
        url: reader.result
      }]);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="garden-bg">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;700&display=swap');
        .garden-bg { min-height: 100vh; background: #fdfaf1; font-family: 'Comfortaa', cursive; color: #4a5d4e; text-align: center; padding: 60px 20px; position: relative; }
        .title { font-size: 3.2rem; color: #5b7a61; margin-bottom: 30px; }
        .btn-primary { background: #7ca38a; color: white; border: none; padding: 14px 28px; border-radius: 50px; font-weight: bold; cursor: pointer; margin: 10px; transition: 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .btn-primary:hover { transform: translateY(-2px); background: #6b8e76; }
        .flower-wrapper { position: absolute; display: flex; flex-direction: column; align-items: center; z-index: 10; cursor: pointer; }
        .flower-card { font-size: 3.5rem; transition: 0.3s; }
        .flower-card:hover { transform: scale(1.1) rotate(5deg); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(74, 93, 78, 0.6); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal { background: white; padding: 40px; border-radius: 30px; width: 90%; max-width: 450px; position: relative; box-shadow: 0 20px 50px rgba(0,0,0,0.2); }
        .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px; padding: 20px; }
        .media-item { border-radius: 15px; overflow: hidden; position: relative; background: #eee; height: 180px; cursor: zoom-in; }
        .media-item img, .media-item video { width: 100%; height: 100%; object-fit: cover; }
        .del-mini { 
          position: absolute; top: 5px; right: 5px; background: rgba(255,255,255,0.9); 
          border: none; border-radius: 50%; width: 18px; height: 18px; 
          cursor: pointer; color: #ff5c5c; font-size: 10px; display: flex; align-items: center; justify-content: center;
        }
        .full-media-box { max-width: 90%; max-height: 90%; }
        .full-media-box img, .full-media-box video { width: auto; height: auto; max-width: 100%; max-height: 80vh; border-radius: 10px; }
      `}</style>

      <header>
        <p style={{ letterSpacing: '3px', opacity: 0.6, fontWeight: 'bold' }}>ОТ КОЛЛЕГ С ЛЮБОВЬЮ</p>
        <h1 className="title">Маша, мы будем очень по тебе скучать</h1>
        <div style={{ marginBottom: '60px' }}>
          <button className="btn-primary" onClick={() => setShowForm(true)}>💌 Написать пожелание</button>
          <button className="btn-primary" style={{ background: '#e9c4a6' }} onClick={() => setShowArchive(true)}>✨ Шкатулка воспоминаний</button>
        </div>
      </header>

      {/* САД */}
      <main style={{ position: 'relative', minHeight: '500px' }}>
        {memories.map((m) => (
          <motion.div key={m.id} initial={{ scale: 0 }} animate={{ scale: 1 }} className="flower-wrapper" style={{ left: `${m.x}%`, top: `${m.y}%` }} onClick={() => setSelectedFlower(m)}>
            <div className="flower-card">🌸</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{m.name}</div>
          </motion.div>
        ))}
      </main>

      {/* ПРОСМОТР ЦВЕТКА + УДАЛЕНИЕ ТОЛЬКО СВОИХ */}
      <AnimatePresence>
        {selectedFlower && (
          <div className="modal-overlay" onClick={() => setSelectedFlower(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="modal" onClick={e => e.stopPropagation()}>
              <h3 style={{ color: '#7ca38a' }}>Для Маши от {selectedFlower.name}</h3>
              <p style={{ fontSize: '1.2rem', fontStyle: 'italic', margin: '30px 0' }}>"{selectedFlower.text}"</p>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                {selectedFlower.authorId === USER_ID && (
                  <button onClick={() => {
                    if (confirm("Удалить?")) { setMemories(memories.filter(f => f.id !== selectedFlower.id)); setSelectedFlower(null); }
                  }} style={{ background: 'none', border: '1px solid #ff5c5c', color: '#ff5c5c', padding: '5px 15px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px' }}>
                    Удалить моё
                  </button>
                )}
                <button className="btn-primary" style={{ margin: 0 }} onClick={() => setSelectedFlower(null)}>Закрыть</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ШКАТУЛКА: ГАЛЕРЕЯ */}
      <AnimatePresence>
        {showArchive && (
          <div className="modal-overlay" style={{ background: '#fdfaf1', alignItems: 'flex-start', overflowY: 'auto', padding: '40px 20px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
              <button onClick={() => setShowArchive(false)} style={{ float: 'right', fontSize: '30px', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
              <h2 className="title">Шкатулка воспоминаний</h2>

              <div style={{ marginBottom: '30px' }}>
                <label className="btn-primary" style={{ display: 'inline-block', cursor: 'pointer' }}>
                  Добавить фото/видео
                  <input type="file" hidden accept="image/*,video/*" onChange={handleFileUpload} />
                </label>
              </div>

              <div className="media-grid">
                {archiveMedia.map(item => (
                  <div key={item.id} className="media-item" onClick={() => setFullScreenMedia(item)}>
                    {item.authorId === USER_ID && (
                      <button className="del-mini" onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Удалить?")) setArchiveMedia(archiveMedia.filter(i => i.id !== item.id));
                      }}>✕</button>
                    )}
                    {item.type === 'image' ? <img src={item.url} /> : <video src={item.url} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ЛАЙТБОКС (ЗУМ МЕДИА) */}
      <AnimatePresence>
        {fullScreenMedia && (
          <div className="modal-overlay" onClick={() => setFullScreenMedia(null)}>
            <div className="full-media-box" onClick={e => e.stopPropagation()}>
              {fullScreenMedia.type === 'image' ?
                <img src={fullScreenMedia.url} /> :
                <video src={fullScreenMedia.url} controls autoPlay />
              }
              <button onClick={() => setFullScreenMedia(null)} style={{ display: 'block', margin: '20px auto', color: 'white', background: 'none', border: '1px solid white', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer' }}>Закрыть</button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ФОРМА */}
      <AnimatePresence>
        {showForm && (
          <div className="modal-overlay">
            <motion.div className="modal" initial={{ y: 20 }} animate={{ y: 0 }}>
              <h2 style={{ marginBottom: '20px' }}>Посадить слово</h2>
              <form onSubmit={addMemory}>
                <input name="name" placeholder="Твое имя" required />
                <textarea name="text" placeholder="Пожелание..." rows="5" required />
                <button type="submit" className="btn-primary" style={{ width: '100%', margin: '0' }}>Отправить</button>
                <button type="button" onClick={() => setShowForm(false)} style={{ display: 'block', margin: '15px auto 0', color: '#999', border: 'none', background: 'none', cursor: 'pointer' }}>Отмена</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer style={{ marginTop: '100px', opacity: 0.6 }}><h3>Спасибо за всё, Маш ✿</h3></footer>
    </div>
  );
}

export default App;