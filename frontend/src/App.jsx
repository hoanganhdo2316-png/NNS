import { useState, useEffect, useRef } from 'react'

const API = 'https://api.nns.id.vn'

// ── Helpers ──────────────────────────────────────────────
const getToken = () => localStorage.getItem('agribot_token')
const getUser  = () => localStorage.getItem('agribot_user')
const saveAuth = (token, username) => {
  localStorage.setItem('agribot_token', token)
  localStorage.setItem('agribot_user', username)
}
const clearAuth = () => {
  localStorage.removeItem('agribot_token')
  localStorage.removeItem('agribot_user')
}

// ── CSS ──────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300&family=DM+Mono:wght@300;400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #f5f2ec;
    --bg2:       #edeae2;
    --bg3:       #e4e0d6;
    --surface:   #ffffff;
    --border:    #d4cfc4;
    --text:      #2a2520;
    --text2:     #6b6560;
    --text3:     #9b9590;
    --accent:    #3d7a4a;
    --accent2:   #2d5a38;
    --accent-bg: #e8f3eb;
    --danger:    #c0392b;
    --shadow:    0 2px 12px rgba(0,0,0,0.08);
    --shadow-lg: 0 8px 32px rgba(0,0,0,0.12);
    --radius:    12px;
    --radius-sm: 8px;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --bg:        #141210;
      --bg2:       #1c1a17;
      --bg3:       #242119;
      --surface:   #1c1a17;
      --border:    #302c26;
      --text:      #e8e4dc;
      --text2:     #9a9590;
      --text3:     #6a6560;
      --accent:    #5a9e68;
      --accent2:   #4a8e58;
      --accent-bg: #1a2e1e;
      --shadow:    0 2px 12px rgba(0,0,0,0.3);
      --shadow-lg: 0 8px 32px rgba(0,0,0,0.4);
    }
  }

  body {
    font-family: 'Crimson Pro', Georgia, serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    font-size: 16px;
    line-height: 1.6;
  }

  /* ── AUTH ── */
  .auth-wrap {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: var(--bg);
    position: relative;
    overflow: hidden;
  }
  .auth-wrap::before {
    content: '';
    position: absolute;
    width: 600px; height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--accent-bg) 0%, transparent 70%);
    top: -200px; right: -200px;
    pointer-events: none;
  }
  .auth-wrap::after {
    content: '';
    position: absolute;
    width: 400px; height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--accent-bg) 0%, transparent 70%);
    bottom: -150px; left: -150px;
    pointer-events: none;
  }
  .auth-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 48px;
    width: 100%;
    max-width: 440px;
    box-shadow: var(--shadow-lg);
    position: relative;
    z-index: 1;
    animation: fadeUp 0.5s ease;
  }
  .auth-logo {
    text-align: center;
    margin-bottom: 32px;
  }
  .auth-logo .leaf { font-size: 40px; display: block; margin-bottom: 8px; }
  .auth-logo h1 {
    font-size: 28px;
    font-weight: 600;
    color: var(--accent);
    letter-spacing: -0.5px;
  }
  .auth-logo p {
    font-size: 14px;
    color: var(--text2);
    font-style: italic;
    margin-top: 4px;
  }
  .auth-tabs {
    display: flex;
    border-bottom: 1px solid var(--border);
    margin-bottom: 28px;
  }
  .auth-tab {
    flex: 1;
    padding: 10px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-size: 15px;
    color: var(--text2);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all 0.2s;
  }
  .auth-tab.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
    font-weight: 600;
  }
  .form-group { margin-bottom: 18px; }
  .form-group label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--text2);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-family: 'DM Mono', monospace;
  }
  .form-group input {
    width: 100%;
    padding: 12px 16px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text);
    font-family: inherit;
    font-size: 15px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .form-group input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-bg);
  }
  .btn-primary {
    width: 100%;
    padding: 14px;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
    margin-top: 8px;
  }
  .btn-primary:hover { background: var(--accent2); }
  .btn-primary:active { transform: scale(0.98); }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .auth-error {
    background: #fde8e6;
    border: 1px solid #f5c6c2;
    color: var(--danger);
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    font-size: 14px;
    margin-bottom: 16px;
  }
  @media (prefers-color-scheme: dark) {
    .auth-error { background: #2e1a18; border-color: #5a2e28; }
  }

  /* ── MAIN LAYOUT ── */
  .app-layout {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }

  /* ── SIDEBAR ── */
  .sidebar {
    width: 280px;
    background: var(--bg2);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    transition: transform 0.3s ease;
  }
  .sidebar-header {
    padding: 20px 20px 16px;
    border-bottom: 1px solid var(--border);
  }
  .sidebar-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }
  .sidebar-brand .leaf { font-size: 24px; }
  .sidebar-brand h2 {
    font-size: 18px;
    font-weight: 600;
    color: var(--accent);
  }
  .sidebar-user {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--accent-bg);
    border-radius: var(--radius-sm);
    padding: 10px 12px;
  }
  .sidebar-user-info { display: flex; align-items: center; gap: 8px; }
  .avatar {
    width: 32px; height: 32px;
    background: var(--accent);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: white;
    font-size: 14px;
    font-weight: 600;
    font-family: 'DM Mono', monospace;
  }
  .username { font-size: 14px; font-weight: 600; color: var(--text); }
  .btn-logout {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text2);
    font-size: 18px;
    padding: 4px;
    border-radius: 6px;
    transition: color 0.2s, background 0.2s;
    line-height: 1;
  }
  .btn-logout:hover { color: var(--danger); background: rgba(192,57,43,0.1); }

  /* Stats */
  .stats-section {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
  }
  .stats-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text3);
    font-family: 'DM Mono', monospace;
    margin-bottom: 10px;
  }
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 10px 8px;
    text-align: center;
  }
  .stat-num {
    font-size: 20px;
    font-weight: 600;
    color: var(--accent);
    font-family: 'DM Mono', monospace;
    line-height: 1;
  }
  .stat-desc { font-size: 11px; color: var(--text2); margin-top: 3px; }

  /* History */
  .history-section {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
  }
  .history-section::-webkit-scrollbar { width: 4px; }
  .history-section::-webkit-scrollbar-track { background: transparent; }
  .history-section::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
  .history-item {
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    border: 1px solid transparent;
    margin-bottom: 6px;
    transition: all 0.15s;
  }
  .history-item:hover {
    background: var(--surface);
    border-color: var(--border);
  }
  .history-q {
    font-size: 13px;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
  }
  .history-time {
    font-size: 11px;
    color: var(--text3);
    margin-top: 2px;
    font-family: 'DM Mono', monospace;
  }
  .history-empty {
    font-size: 13px;
    color: var(--text3);
    text-align: center;
    padding: 20px 0;
    font-style: italic;
  }

  /* ── CHAT AREA ── */
  .chat-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg);
  }
  .chat-header {
    padding: 16px 24px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .chat-header-info h3 {
    font-size: 17px;
    font-weight: 600;
    color: var(--text);
  }
  .chat-header-info p {
    font-size: 13px;
    color: var(--text2);
    font-style: italic;
  }
  .online-dot {
    width: 8px; height: 8px;
    background: #2ecc71;
    border-radius: 50%;
    box-shadow: 0 0 0 2px rgba(46,204,113,0.3);
    flex-shrink: 0;
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .messages::-webkit-scrollbar { width: 4px; }
  .messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  .welcome-screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 40px;
    gap: 16px;
  }
  .welcome-icon { font-size: 56px; }
  .welcome-screen h2 {
    font-size: 26px;
    color: var(--text);
    font-weight: 300;
  }
  .welcome-screen h2 span { font-weight: 600; color: var(--accent); }
  .welcome-screen p { font-size: 15px; color: var(--text2); max-width: 360px; font-style: italic; }
  .suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin-top: 8px;
  }
  .suggestion-chip {
    padding: 8px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    font-size: 13px;
    color: var(--text2);
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s;
  }
  .suggestion-chip:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-bg);
  }

  .msg-row {
    display: flex;
    gap: 12px;
    animation: fadeUp 0.3s ease;
  }
  .msg-row.user { flex-direction: row-reverse; }
  .msg-avatar {
    width: 34px; height: 34px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .msg-avatar.bot { background: var(--accent-bg); }
  .msg-avatar.user-av { background: var(--accent); color: white; font-size: 13px; font-family: 'DM Mono', monospace; font-weight: 600; }
  .msg-bubble {
    max-width: 70%;
    padding: 12px 16px;
    border-radius: 16px;
    font-size: 15px;
    line-height: 1.65;
  }
  .msg-row.bot .msg-bubble {
    background: var(--surface);
    border: 1px solid var(--border);
    border-bottom-left-radius: 4px;
  }
  .msg-row.user .msg-bubble {
    background: var(--accent);
    color: white;
    border-bottom-right-radius: 4px;
  }
  .msg-time {
    font-size: 11px;
    color: var(--text3);
    margin-top: 4px;
    font-family: 'DM Mono', monospace;
  }
  .msg-row.user .msg-time { text-align: right; }

  .typing-indicator {
    display: flex;
    gap: 5px;
    align-items: center;
    padding: 14px 18px;
  }
  .typing-dot {
    width: 7px; height: 7px;
    background: var(--text3);
    border-radius: 50%;
    animation: bounce 1.2s infinite;
  }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }

  /* ── INPUT ── */
  .input-area {
    padding: 16px 24px 20px;
    background: var(--surface);
    border-top: 1px solid var(--border);
  }
  .input-row {
    display: flex;
    gap: 10px;
    align-items: flex-end;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 8px 8px 8px 16px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .input-row:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-bg);
  }
  .input-row textarea {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-family: inherit;
    font-size: 15px;
    color: var(--text);
    resize: none;
    max-height: 120px;
    min-height: 24px;
    line-height: 1.5;
    padding: 4px 0;
  }
  .input-row textarea::placeholder { color: var(--text3); }
  .btn-send {
    width: 38px; height: 38px;
    background: var(--accent);
    border: none;
    border-radius: 10px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: background 0.2s, transform 0.1s;
    color: white;
    font-size: 16px;
  }
  .btn-send:hover { background: var(--accent2); }
  .btn-send:active { transform: scale(0.93); }
  .btn-send:disabled { opacity: 0.4; cursor: not-allowed; }
  .input-hint {
    font-size: 12px;
    color: var(--text3);
    text-align: center;
    margin-top: 8px;
    font-style: italic;
  }

  /* ── MOBILE ── */
  .btn-menu {
    display: none;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 22px;
    color: var(--text2);
    padding: 4px;
  }
  .sidebar-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 10;
  }
  @media (max-width: 768px) {
    .btn-menu { display: block; }
    .sidebar {
      position: fixed;
      left: 0; top: 0; bottom: 0;
      z-index: 20;
      transform: translateX(-100%);
    }
    .sidebar.open { transform: translateX(0); }
    .sidebar-overlay.open { display: block; }
    .msg-bubble { max-width: 85%; }
  }

  /* ── ANIMATIONS ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30%           { transform: translateY(-6px); }
  }
`

// ── Components ───────────────────────────────────────────

function AuthPage({ onLogin }) {
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    setError(''); setLoading(true)
    try {
      if (tab === 'register') {
        const res = await fetch(`${API}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: form.username, email: form.email, password: form.password })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail)
        setTab('login')
        setError('')
        setForm(f => ({ ...f, email: '' }))
      } else {
        const body = new URLSearchParams({ username: form.username, password: form.password })
        const res = await fetch(`${API}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail)
        saveAuth(data.access_token, form.username)
        onLogin(form.username)
      }
    } catch (e) {
      setError(e.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  const onKey = (e) => { if (e.key === 'Enter') handleSubmit() }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="leaf">🌿</span>
          <h1>AgriBot</h1>
          <p>Trợ lý nông nghiệp Lâm Đồng</p>
        </div>
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError('') }}>Đăng nhập</button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError('') }}>Đăng ký</button>
        </div>
        {error && <div className="auth-error">⚠ {error}</div>}
        <div className="form-group">
          <label>Tên đăng nhập</label>
          <input value={form.username} onChange={set('username')} onKeyDown={onKey} placeholder="username" autoFocus />
        </div>
        {tab === 'register' && (
          <div className="form-group">
            <label>Email</label>
            <input value={form.email} onChange={set('email')} onKeyDown={onKey} placeholder="email@gmail.com" type="email" />
          </div>
        )}
        <div className="form-group">
          <label>Mật khẩu</label>
          <input value={form.password} onChange={set('password')} onKeyDown={onKey} placeholder="••••••••" type="password" />
        </div>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? '⏳ Đang xử lý...' : tab === 'login' ? '🌱 Đăng nhập' : '✨ Tạo tài khoản'}
        </button>
      </div>
    </div>
  )
}

function MainApp({ username, onLogout }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState({ today_messages: 0, total_users: 0, total_chats: 0 })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => { loadHistory(); loadStats() }, [])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const loadHistory = async () => {
    try {
      const res = await fetch(`${API}/history`, { headers: { Authorization: `Bearer ${getToken()}` } })
      if (res.ok) setHistory(await res.json())
    } catch {}
  }

  const loadStats = async () => {
    try {
      const res = await fetch(`${API}/stats`)
      if (res.ok) setStats(await res.json())
    } catch {}
  }

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    setLoading(true)
    setMessages(prev => [...prev, { role: 'user', text: msg, time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }])

    try {
      const res = await fetch(`${API}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ user_message: msg })
      })
      if (!res.ok) throw new Error('Lỗi server')
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'bot', text: data.answer, time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }])
      loadHistory(); loadStats()
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Server đang bận, vui lòng thử lại sau!', time: '' }])
    } finally {
      setLoading(false)
    }
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const autoResize = (e) => {
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const SUGGESTIONS = ['Cà phê bị sâu đục quả?', 'Sầu riêng ra hoa không đậu trái', 'Phân bón cho rau Đà Lạt', 'Thời tiết ảnh hưởng mùa vụ']

  return (
    <div className="app-layout">
      {/* Overlay mobile */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="leaf">🌿</span>
            <h2>AgriBot</h2>
          </div>
          <div className="sidebar-user">
            <div className="sidebar-user-info">
              <div className="avatar">{username[0].toUpperCase()}</div>
              <span className="username">{username}</span>
            </div>
            <button className="btn-logout" onClick={() => { clearAuth(); onLogout() }} title="Đăng xuất">⏻</button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-section">
          <div className="stats-label">Thống kê</div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-num">{stats.today_messages}</div>
              <div className="stat-desc">Hôm nay</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{stats.total_users}</div>
              <div className="stat-desc">Người dùng</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{stats.total_chats}</div>
              <div className="stat-desc">Tổng chat</div>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="history-section">
          <div className="stats-label" style={{ marginBottom: 12 }}>Lịch sử hỏi đáp</div>
          {history.length === 0
            ? <div className="history-empty">Chưa có lịch sử chat</div>
            : history.map((h, i) => (
              <div key={i} className="history-item" onClick={() => { sendMessage(h.question); setSidebarOpen(false) }}>
                <div className="history-q">🌱 {h.question}</div>
                <div className="history-time">{h.time}</div>
              </div>
            ))
          }
        </div>
      </aside>

      {/* Chat */}
      <div className="chat-area">
        <div className="chat-header">
          <button className="btn-menu" onClick={() => setSidebarOpen(true)}>☰</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div className="online-dot" />
            <div className="chat-header-info">
              <h3>AgriBot Lâm Đồng</h3>
              <p>Sinh viên FPT University — Hỗ trợ nông nghiệp</p>
            </div>
          </div>
        </div>

        <div className="messages">
          {messages.length === 0 ? (
            <div className="welcome-screen">
              <div className="welcome-icon">🌾</div>
              <h2>Chào <span>{username}</span>!</h2>
              <p>Hỏi AgriBot về cây trồng, sâu bệnh, phân bón và mùa vụ tại Lâm Đồng</p>
              <div className="suggestions">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className="suggestion-chip" onClick={() => sendMessage(s)}>{s}</button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`msg-row ${m.role}`}>
                <div className={`msg-avatar ${m.role === 'bot' ? 'bot' : 'user-av'}`}>
                  {m.role === 'bot' ? '🌿' : username[0].toUpperCase()}
                </div>
                <div>
                  <div className="msg-bubble">{m.text}</div>
                  {m.time && <div className="msg-time">{m.time}</div>}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="msg-row bot">
              <div className="msg-avatar bot">🌿</div>
              <div className="msg-bubble">
                <div className="typing-indicator">
                  <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <div className="input-row">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(e) }}
              onKeyDown={onKey}
              placeholder="Hỏi về cà phê, sầu riêng, rau củ Lâm Đồng..."
              disabled={loading}
              rows={1}
            />
            <button className="btn-send" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
              {loading ? '⏳' : '➤'}
            </button>
          </div>
          <div className="input-hint">Enter để gửi · Shift+Enter xuống dòng</div>
        </div>
      </div>
    </div>
  )
}

// ── Root ─────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => getUser())

  return (
    <>
      <style>{css}</style>
      {user
        ? <MainApp username={user} onLogout={() => setUser(null)} />
        : <AuthPage onLogin={(u) => setUser(u)} />
      }
    </>
  )
}
