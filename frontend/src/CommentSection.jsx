import React, { useState, useEffect } from 'react';
import styles from './CommentSection.module.css';

const API_BASE = import.meta.env.VITE_API_BASE || "https://internship-at-elevanceskill-project1-mf58z2r0a.vercel.app/" || "http://localhost:5000/api";

export default function CommentSection() {
  // Session & Auth state
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  // Core stream states
  const [comments, setComments] = useState([]);
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
      const res = await fetch(`${API_BASE}/comments`);
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

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    
    if (!email || !password) {
      setAuthError("Please provide both parameters to authenticate.");
      return;
    }

    try {
      const endpoint = isSignUp ? '/auth/signup' : '/auth/signin';
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (!response.ok) {
        setAuthError(result.error || "Authorization transaction rejected.");
        return;
      }

      if (isSignUp && !result.session) {
        setAuthError("Signup processing completed! Check email confirmation settings if active.");
        return;
      }

      if (result.session) {
        setSession(result.session);
        setEmail("");
        setPassword("");
      }
    } catch (err) {
      setAuthError("Communication timeout with server ecosystem.");
    }
  };

  const handleSignOut = () => {
    setSession(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session || error || !newComment.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          content: newComment,
          detected_language: 'en' // In production, this can be handled by a lang detector
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
    if (!session) {
      alert("Account registration session required to access interaction buttons.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/comments/${id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
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

  // Explicit, on-demand user translation engine toggle
  const demandedTranslation = async (id, originalText, detectedLang) => {
    setComments(prev => prev.map(comment => {
      if (comment.id === id) {
        if (comment.translatedContent) {
          return { ...comment, translatedContent: null }; // Toggle back to original state
        }
        
        // Mock translation payload conversions
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
            <p className={styles.subtitle}>Clean, high-shadow international workspace engine</p>
          </div>
          <button onClick={toggleTheme} className={styles.themeToggle}>
            {theme === 'day' ? '🕶️ Dark Mode' : '☀️ Light Mode'}
          </button>
        </header>

        {/* Auth Entry Grid */}
        <div className={styles.formCard}>
          {session ? (
            <div className={styles.authProfile}>
              <span>Active Operator: <b>{session.user.email}</b></span>
              <button onClick={handleSignOut} className={styles.signOutBtn}>Disconnect Session</button>
            </div>
          ) : (
            <form onSubmit={handleAuth} className={styles.authForm}>
              <h4>{isSignUp ? "Create Workspace Account" : "Identity Authorization Required"}</h4>
              <div className={styles.authInputs}>
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  value={email}
                  onChange={e => setEmail(e.target.value)} 
                  className={styles.selectInput}
                />
                <input 
                  type="password" 
                  placeholder="Security Password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)} 
                  className={styles.selectInput}
                />
              </div>
              <div className={styles.authActions}>
                <button type="submit" className={styles.submitBtn}>
                  {isSignUp ? "Complete Signup" : "Authenticate Entry"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsSignUp(!isSignUp)} 
                  className={styles.switchAuthBtn}
                >
                  {isSignUp ? "Already registered? Sign In" : "Need an identity? Sign Up"}
                </button>
              </div>
              {authError && <p className={styles.errorMessage} style={{marginTop: '0.5rem'}}>⚠️ {authError}</p>}
            </form>
          )}
        </div>

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
          <textarea
            value={newComment}
            disabled={!session}
            onChange={handleTextChange}
            placeholder={session ? "Type your insight cleanly..." : "Authentication wrapper locked. Authorize account credentials above."}
            className={`${styles.textarea} ${error ? styles.textareaError : ''}`}
          />
          <div className={styles.formFooter}>
            {error && <p className={styles.errorMessage}>{error}</p>}
            <button 
              type="submit" 
              disabled={!session || !!error || !newComment.trim()}
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
                  <div className={styles.avatar}>{comment.username.charAt(0).toUpperCase()}</div>
                  <span className={styles.author}>{comment.username}</span>
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
