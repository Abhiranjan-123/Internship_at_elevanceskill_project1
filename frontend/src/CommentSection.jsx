import React, { useState, useEffect } from 'react';
import styles from './CommentSection.module.css';

const API_BASE = import.meta.env.VITE_API_BASE || "https://internship-at-elevanceskill-project1-1.onrender.com";

export default function CommentSection() {
  // Core stream states
  const [comments, setComments] = useState([]);
  const [username, setUsername] = useState("");
  const [newComment, setNewComment] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [error, setError] = useState("");
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'day');

  // Load theme and stream on initial layout load
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchComments();
    const interval = setInterval(fetchComments, 5000); // Auto-refresh stream metrics
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'day' ? 'night' : 'day');
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/comments`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setComments(data);
      }
    } catch (err) {
      console.error("Failed fetching stream records:", err);
    }
  };

  const handleTextChange = (e) => {
    const text = e.target.value;
    const dangerousPattern = /[<>{}\[\]\\\/]/;
    
    if (dangerousPattern.test(text)) {
      setError("Forbidden formatting syntax identified (< > { } [ ] \\ /). Content blocked.");
    } else {
      setError("");
    }
    setNewComment(text);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (error || !newComment.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username.trim() || "Guest",
          content: newComment,
          detected_language: 'en'
        })
      });

      const result = await response.json();
      if (response.ok) {
        setComments([result, ...comments]);
        setNewComment("");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to dispatch insight transmission.");
    }
  };

  const handleVote = async (id, type) => {
    try {
      const response = await fetch(`${API_BASE}/api/comments/${id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type })
      });

      const result = await response.json();
      if (result.status === "moderated") {
        setComments(prev => prev.filter(c => c.id !== id));
      } else {
        fetchComments(); // Immediate state synchronization
      }
    } catch (err) {
      console.error("Vote network failure:", err);
    }
  };

  const demandedTranslation = async (id, originalText, detectedLang) => {
    setComments(prev => prev.map(comment => {
      if (comment.id === id) {
        if (comment.translatedContent) {
          return { ...comment, translatedContent: null };
        }
        
        const mockTranslations = {
          es: "Hello! I am glad to see a platform that includes everyone.",
          ja: "Hello! This translation feature is really convenient."
        };

        return { 
          ...comment, 
          translatedContent: mockTranslations[detectedLang] || "Requested translation mapping unavailable..." 
        };
      }
      return comment;
    }));
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Global Workspace</h1>
            <p className={styles.subtitle}>Clean, open-access international workspace engine</p>
          </div>
          <button onClick={toggleTheme} className={styles.themeToggle}>
            {theme === 'day' ? '🕶️ Dark Mode' : '☀️ Light Mode'}
          </button>
        </header>

        {/* Workspace Controls Preference Bar */}
        <div className={styles.preferenceBar}>
          <span className={styles.prefLabel}>Translate demand targets into:</span>
          <select 
            value={targetLanguage} 
            onChange={(e) => setTargetLanguage(e.target.value)}
            className={styles.selectInput}
          >
            <option value="en">English (EN)</option>
            <option value="es">Español (ES)</option>
            <option value="ja">日本語 (JA)</option>
          </select>
        </div>

        {/* Input Interactive Panel */}
        <form onSubmit={handleSubmit} className={styles.formCard}>
          <input 
            type="text"
            placeholder="Your Name (Optional, defaults to Guest)"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className={styles.selectInput}
            style={{ marginBottom: '1rem', width: '100%' }}
          />
          <textarea
            value={newComment}
            onChange={handleTextChange}
            placeholder="Type your insight cleanly..."
            className={`${styles.textarea} ${error ? styles.textareaError : ''}`}
          />
          <div className={styles.formFooter}>
            {error && <p className={styles.errorMessage}>{error}</p>}
            <button 
              type="submit" 
              disabled={!!error || !newComment.trim()}
              className={styles.submitBtn}
            >
              Submit Content
            </button>
          </div>
        </form>

        {/* Content Feeds Render Stream */}
        <div className={styles.stream}>
          {comments.map((comment) => (
            <div key={comment.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.userInfo}>
                  <div className={styles.avatar}>{(comment.username || 'G').charAt(0).toUpperCase()}</div>
                  <span className={styles.author}>{comment.username || 'Guest'}</span>
                </div>
                <span className={styles.location}>
                  📍 {comment.city_name} • <small>{new Date(comment.created_at).toLocaleDateString()}</small>
                </span>
              </div>

              <p className={styles.content}>
                {comment.translatedContent ? comment.translatedContent : comment.content}
              </p>
              
              {comment.translatedContent && (
                <div className={styles.translationIndicator}>
                  <span>✓ Translated via explicit request</span>
                </div>
              )}

              <div className={styles.cardFooter}>
                <div className={styles.actionGroup}>
                  <button onClick={() => handleVote(comment.id, 'like')} className={styles.interactionBtn}>
                    👍 <b className={styles.likeCounter}>{comment.likes}</b>
                  </button>
                  <button onClick={() => handleVote(comment.id, 'dislike')} className={styles.interactionBtn}>
                    👎 <span style={{opacity: 0.7}}>{comment.dislikes}</span>
                  </button>
                </div>

                {comment.detected_language !== targetLanguage && (
                  <button 
                    onClick={() => demandedTranslation(comment.id, comment.content, comment.detected_language)}
                    className={styles.translateActionBtn}
                  >
                    {comment.translatedContent ? "Original Variant" : `Translate text (${targetLanguage.toUpperCase()})`}
                  </button>
                )}
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <div className={styles.emptyFeed}>
              <p>Stream directory empty. No statements documented yet.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
