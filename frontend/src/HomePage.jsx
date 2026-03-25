import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'https://api.nns.id.vn'

const TABS = {
  robusta: { label:'Robusta London', sub:'ICE Futures · USD/tấn' },
  arabica: { label:'Arabica NY',     sub:'ICE Futures · USc/lb'  },
}

const fmt = n => n?.toLocaleString('vi-VN') ?? '—'
const toVN = d => d ? new Date(d).toLocaleString('vi-VN', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' }) : '—'

function ChangeTag({ val, suffix = '' }) {
  const cls = val > 0 ? 'tag-up' : val < 0 ? 'tag-down' : 'tag-flat'
  const icon = val > 0 ? '▲' : val < 0 ? '▼' : '─'
  return (
    <span className={cls} style={{fontSize:12,fontFamily:'JetBrains Mono,monospace',padding:'2px 7px',borderRadius:6,fontWeight:700,display:'inline-block'}}>
      {icon} {fmt(Math.abs(val))}{suffix}
    </span>
  )
}

function CoffeePriceDisplay({ data, loading, usdVnd, vcbAt, tab, onRefresh }) {
  if (loading && !data) return (
    <div style={{textAlign:'center',padding:'32px 0',color:'var(--txt3)',fontSize:13}}>
      <div style={{fontSize:22,marginBottom:8}}>⏳</div>
      Đang tải giá thị trường...
    </div>
  )

  if (!data) return (
    <div style={{textAlign:'center',padding:'24px 0',color:'var(--txt3)',fontSize:13}}>
      ⚠ Không thể tải giá. <span style={{color:'var(--green)',cursor:'pointer',fontWeight:600}} onClick={onRefresh}>Thử lại</span>
    </div>
  )

  const d      = tab === 'arabica' ? data.arabica : data.robusta
  const isUp   = d.change >= 0
  const upClr  = 'var(--green)'
  const dnClr  = 'var(--red)'
  const clr    = isUp ? upClr : dnClr
  const bg     = isUp ? 'var(--green3)' : 'var(--red2)'
  const bdr    = isUp ? 'var(--bdr2)'   : '#f5c6c2'

  const vnd = usdVnd
    ? tab === 'arabica'
      ? Math.round(d.price / 100 * 2.20462 * usdVnd)
      : Math.round(d.price / 1000 * usdVnd)
    : null

  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      <div style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        background:bg, border:`1.5px solid ${bdr}`,
        borderRadius:'var(--rs)',padding:'12px 14px',
      }}>
        <div>
          <div style={{fontSize:11,color:'var(--txt2)',fontWeight:500,marginBottom:2}}>{d.market}</div>
          <div style={{
            fontSize:24,fontWeight:800,letterSpacing:'-.5px',
            fontFamily:'JetBrains Mono,monospace',color:clr,lineHeight:1,
          }}>
            {tab === 'arabica' ? d.price.toFixed(2) : d.price.toLocaleString('en-US')}
            <span style={{fontSize:12,fontWeight:400,color:'var(--txt3)',marginLeft:5}}>{d.unit}</span>
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{
            fontSize:14,fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:clr,
          }}>
            {isUp ? '▲ +' : '▼ '}{Math.abs(d.change).toFixed(tab==='arabica'?2:0)}
          </div>
          <div style={{
            fontSize:12,fontWeight:600,fontFamily:'JetBrains Mono,monospace',
            color:clr,marginTop:2,
          }}>
            {isUp ? '+' : ''}{d.pct}%
          </div>
          <div style={{fontSize:10,color:'var(--txt3)',marginTop:4}}>
            Hôm qua: {tab==='arabica' ? d.prev.toFixed(2) : d.prev.toLocaleString('en-US')}
          </div>
        </div>
      </div>

      <div style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        background:'var(--bg2)',border:'1.5px solid var(--bdr)',
        borderRadius:'var(--rs)',padding:'10px 14px',
      }}>
        <div>
          <div style={{fontSize:11,color:'var(--txt2)',fontWeight:500}}>Giá tham khảo quy đổi</div>
          <div style={{
            fontSize:18,fontWeight:800,fontFamily:'JetBrains Mono,monospace',
            color:'var(--green)',marginTop:2,
          }}>
            {vnd ? `${vnd.toLocaleString('vi-VN')} đ/kg` : '—'}
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:10,color:'var(--txt3)'}}>Tỷ giá USD/VND</div>
          <div style={{fontSize:12,fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:'var(--txt2)',marginTop:2}}>
            {usdVnd ? `1 USD = ${usdVnd.toLocaleString('vi-VN')} đ` : '—'}
          </div>
          <div style={{fontSize:10,color:'var(--txt3)',marginTop:2}}>{vcbAt || ''}</div>
        </div>
      </div>

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontSize:10,color:'var(--txt3)'}}>
          Nguồn: Yahoo Finance · Delay ~15 phút
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          {loading && <span style={{fontSize:10,color:'var(--txt3)'}}>Đang cập nhật...</span>}
          <span
            onClick={onRefresh}
            style={{fontSize:11,color:'var(--green)',cursor:'pointer',fontWeight:600,
              background:'var(--green3)',padding:'3px 8px',borderRadius:6}}
          >↻ Làm mới</span>
          <span style={{fontSize:10,color:'var(--txt3)'}}>Cập nhật: {data.updated_at}</span>
        </div>
      </div>
    </div>
  )
}

function ShopTab({ agents }) {
  const products = agents.flatMap(a => (a.products || []).map(p => ({...p, agentName: a.name, agentId: a._id})))
  if (products.length === 0) return <div className="fu d1" style={{textAlign:'center', padding:40, color:'var(--txt3)'}}>Chưa có mặt hàng nào được đăng.</div>
  
  return (
    <div className="grid-shop fu d1">
      {products.map((p, i) => (
        <div key={p.id || i} className="product-card">
          <div className="product-img-wrap">
            {p.image_url ? (
              <img src={p.image_url} alt={p.name} className="product-img" />
            ) : (
              <div className="product-img-placeholder">📦</div>
            )}
          </div>
          <div className="product-info">
            <div className="product-name">{p.name}</div>
            <div className="product-agent">{p.agentName}</div>
            <div className="product-bottom">
              <div className="product-price">{fmt(p.price)}đ</div>
              <div className="product-unit">/{p.unit}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function AssetsTab({ kg, setKg }) {
  return (
    <div className="card fu d1">
      <h3 style={{fontSize:16, marginBottom:10}}>Tài sản của bạn</h3>
      <p style={{fontSize:13, color:'var(--txt2)', marginBottom:16}}>
        Cài đặt khối lượng cà phê sở hữu để tự động quy đổi ra giá trị ước tính dựa trên giá thị trường.
      </p>
      <div className="kg-row">
        <span className="kg-lbl">Khối lượng (kg)</span>
        <div className="kg-wrap">
          <input className="kg-inp" type="number" inputMode="numeric" value={kg} onChange={e=>setKg(Number(e.target.value))} min={0} />
          <span className="kg-unit">kg</span>
        </div>
      </div>
    </div>
  )
}

function SettingsTab({ isLoggedIn, userName, onLoginClick, onLogout }) {
  return (
    <div className="card fu d1">
      <h3 style={{fontSize:16, marginBottom:16}}>Cài đặt tài khoản</h3>
      {isLoggedIn ? (
        <>
          <div style={{display:'flex', alignItems:'center', gap:12, marginBottom: 20}}>
            <div className="av">{userName ? userName[0].toUpperCase() : 'U'}</div>
            <div>
              <div style={{fontWeight:700}}>{userName}</div>
              <div style={{fontSize:12, color:'var(--green)'}}>Đã đăng nhập</div>
            </div>
          </div>
          <button className="act" style={{width:'100%', borderColor:'var(--red)', color:'var(--red)'}} onClick={onLogout}>
            Đăng xuất
          </button>
        </>
      ) : (
        <>
          <p style={{fontSize:13, color:'var(--txt2)', marginBottom:16}}>Bạn chưa đăng nhập. Đăng nhập để lưu trữ dữ liệu và bảo vệ tài sản.</p>
          <button className="act" style={{width:'100%', borderColor:'var(--green)', color:'var(--green)'}} onClick={onLoginClick}>
            Đăng nhập ngay
          </button>
        </>
      )}
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab]   = useState('market')
  const [showAd, setShowAd]         = useState(true)
  const [tab, setTab]               = useState('robusta')
  const [showLogin, setShowLogin]   = useState(false)
  
  const [kg, setKg]                 = useState(() => Number(localStorage.getItem('nns_coffee_kg')) || 0)
  const [search, setSearch]         = useState('')
  const [usdVnd, setUsdVnd]         = useState(null)
  const [vcbAt, setVcbAt]           = useState('')
  const [coffeePrice, setCoffeePrice] = useState(null)
  const [coffeeLoading, setCoffeeLoading] = useState(true)
  const [agents, setAgents]         = useState([])
  const [agentsLoading, setAgentsLoading] = useState(true)
  const [locationErr, setLocationErr] = useState('')
  const [adData, setAdData]         = useState(null)
  const [showPopup, setShowPopup]   = useState(() => !sessionStorage.getItem('nns_ad_seen'))
  
  const [userName, setUserName] = useState(() => localStorage.getItem('agribot_user'))
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('agribot_token'))

  // Notifications
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const unreadCount = notifications.filter(n => !n.read).length

  const fetchNotifications = async () => {
    const token = localStorage.getItem('agribot_token')
    if (!token) return
    try {
      const r = await fetch(`${API}/user/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (r.ok) setNotifications(await r.json())
    } catch {}
  }

  useEffect(() => {
    if (isLoggedIn) {
      fetchNotifications()
      const id = setInterval(fetchNotifications, 30000)
      return () => clearInterval(id)
    }
  }, [isLoggedIn])

  const markAsRead = async (nid) => {
    const token = localStorage.getItem('agribot_token')
    try {
      await fetch(`${API}/user/notifications/${nid}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(prev => prev.map(n => n._id === nid ? {...n, read:true} : n))
    } catch {}
  }

  const [loginPhone, setLoginPhone] = useState('')
  const [loginPass, setLoginPass]   = useState('')
  const [loginErr, setLoginErr]     = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [regName, setRegName]       = useState('')
  const [splash, setSplash]         = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 1500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    localStorage.setItem('nns_coffee_kg', kg)
  }, [kg])

  const handleLogout = () => {
    localStorage.removeItem('agribot_token')
    localStorage.removeItem('agribot_user')
    setIsLoggedIn(false)
    setUserName(null)
  }

  const submitLogin = async () => {
    setLoginErr('')
    setLoginLoading(true)
    try {
      const data = new URLSearchParams()
      data.append('username', loginPhone)
      data.append('password', loginPass)
      
      const r = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: data
      })
      const d = await r.json()
      if (r.ok) {
        localStorage.setItem('agribot_token', d.access_token)
        localStorage.setItem('agribot_user', d.ho_ten)
        setIsLoggedIn(true)
        setUserName(d.ho_ten)
        setShowLogin(false)
        setLoginPhone('')
        setLoginPass('')
      } else {
        setLoginErr(d.detail || 'Đăng nhập thất bại')
      }
    } catch {
      setLoginErr('Không kết nối được server')
    }
    setLoginLoading(false)
  }

  const submitRegister = async () => {
    setLoginErr('')
    if (!regName || !loginPhone || !loginPass) {
      setLoginErr('Vui lòng điền đủ thông tin')
      return
    }
    setLoginLoading(true)
    try {
      const r = await fetch(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ho_ten: regName, so_dien_thoai: loginPhone, password: loginPass })
      })
      const d = await r.json()
      if (r.ok) {
        setIsRegistering(false)
        setLoginErr('✅ Đăng ký thành công! Hãy đăng nhập.')
      } else {
        setLoginErr(d.detail || 'Đăng ký thất bại')
      }
    } catch {
      setLoginErr('Không kết nối được server')
    }
    setLoginLoading(false)
  }

  // Fetch quảng cáo
  useEffect(() => {
    fetch(`${API}/ads`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && typeof d === 'object' && !d.detail) setAdData(d) })
      .catch(() => {})
  }, [])

  // Fetch danh sách đại lý
  useEffect(() => {
    setAgentsLoading(true)
    
    const fetchAgents = (lat = null, lng = null) => {
      const url = lat && lng ? `${API}/agents?lat=${lat}&lng=${lng}` : `${API}/agents`
      fetch(url)
        .then(r => r.ok ? r.json() : [])
        .then(d => { setAgents(Array.isArray(d) ? d : []); setAgentsLoading(false) })
        .catch(() => { setLocationErr('Không thể tải danh sách đại lý'); setAgentsLoading(false) })
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          fetchAgents(pos.coords.latitude, pos.coords.longitude)
        },
        err => {
          console.warn('Geolocation error:', err)
          fetchAgents()
        },
        { timeout: 5000, maximumAge: 60000 }
      )
    } else {
      fetchAgents()
    }
  }, [])
  
  const validAgents = agents.filter(a => a.price > 0)
  const AVG = validAgents.length > 0
    ? Math.round(validAgents.reduce((s, a) => s + (a.price || 0), 0) / validAgents.length)
    : 0
  const PREV = AVG
  const total = kg * AVG
  const diff  = 0

  // Fetch tỷ giá
  useEffect(() => {
    fetch(`${API}/exchange-rate`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && d.usd_vnd) { setUsdVnd(d.usd_vnd); setVcbAt(d.updated_at) } else { setUsdVnd(25450) } })
      .catch(() => setUsdVnd(25450))
  }, [])

  // Fetch giá cà phê quốc tế
  const loadCoffeePrice = () => {
    setCoffeeLoading(true)
    fetch(`${API}/coffee-price`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && d.robusta && d.arabica) { setCoffeePrice(d) }
        setCoffeeLoading(false)
      })
      .catch(() => setCoffeeLoading(false))
  }

  useEffect(() => {
    loadCoffeePrice()
    const id = setInterval(loadCoffeePrice, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  // Login modal
  useEffect(() => {
    const isLog = !!localStorage.getItem('agribot_token')
    if (isLog) return
    const first = setTimeout(() => setShowLogin(true), 3000)
    return () => clearTimeout(first)
  }, [])

  useEffect(() => {
    const isLog = !!localStorage.getItem('agribot_token')
    if (isLog) return
    if (showLogin) return
    const t = setTimeout(() => setShowLogin(true), 15000)
    return () => clearTimeout(t)
  }, [showLogin])

  if (splash) return (
    <div style={{minHeight:'100dvh', background:'#f2f7f2', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Be Vietnam Pro',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`@keyframes pulse {0%, 100% {transform: scale(1); opacity:1} 50% {transform: scale(1.05); opacity:0.85}}`}</style>
      <img src="/icon-192.png" alt="NNS Logo" style={{width:96,height:96,borderRadius:24,boxShadow:'0 8px 24px rgba(0,0,0,.15)',animation:'pulse 1.5s infinite', background:'#fff'}}/>
      <div style={{fontSize:26, fontWeight:800, color:'#2e7d32', marginTop:24}}>NNS</div>
      <div style={{fontSize:14, color:'#4a6e4a', marginTop:6}}>Giá cà phê Lâm Đồng</div>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --bg:#f2f7f2;--bg2:#e8f2e8;--bg3:#ddeedd;--surf:#fff;
          --bdr:#c8dfc8;--bdr2:#b0cfb0;
          --txt:#1a2e1a;--txt2:#4a6e4a;--txt3:#8aaa8a;
          --green:#2e7d32;--green2:#43a047;--green3:#e8f5e9;
          --red:#c62828;--red2:#ffebee;
          --yellow:#e65100;--yellow2:#fff3e0;
          --r:14px;--rs:10px;
        }
        html,body{background:var(--bg);color:var(--txt);font-family:'Be Vietnam Pro',sans-serif;overscroll-behavior:none;-webkit-text-size-adjust:100%;}
        .page{min-height:100dvh;padding-bottom:calc(80px + env(safe-area-inset-bottom));}

        .tb{position:sticky;top:0;z-index:99;background:rgba(255,255,255,0.96);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:2px solid var(--bdr);padding:10px 14px;padding-top:calc(10px + env(safe-area-inset-top));display:flex;align-items:center;gap:10px;box-shadow:0 2px 12px rgba(46,125,50,0.08);}
        .logo{font-size:18px;font-weight:800;color:var(--green);letter-spacing:-.5px;white-space:nowrap;line-height:1;}
        .logo small{color:var(--txt3);font-weight:400;font-size:10px;display:block;margin-top:1px;}
        .sb{flex:1;position:relative;}
        .sb input{width:100%;padding:9px 12px 9px 34px;background:var(--bg2);border:1.5px solid var(--bdr);border-radius:24px;color:var(--txt);font-family:inherit;font-size:14px;outline:none;-webkit-appearance:none;transition:border-color .2s;}
        .sb input:focus{border-color:var(--green);}
        .sb input::placeholder{color:var(--txt3);}
        .si{position:absolute;left:11px;top:50%;transform:translateY(-50%);font-size:13px;color:var(--txt3);pointer-events:none;}
        
        .btn-bell{width:40px;height:40px;flex-shrink:0;background:var(--bg2);border:1.5px solid var(--bdr);border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative;-webkit-tap-highlight-color:transparent;transition:transform .1s;}
        .btn-bell:active{transform:scale(.92);}
        .bell-dot{position:absolute;top:8px;right:8px;width:10px;height:10px;background:var(--red);border:2px solid #fff;border-radius:50%;}

        .btn-bot{width:40px;height:40px;flex-shrink:0;background:var(--green);border:none;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(46,125,50,0.3);-webkit-tap-highlight-color:transparent;transition:transform .15s;}
        .btn-bot:active{transform:scale(.92);}

        .grid-shop{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
        .product-card{background:var(--surf);border:1px solid var(--bdr);border-radius:var(--rs);overflow:hidden;display:flex;flex-direction:column;box-shadow:0 2px 8px rgba(0,0,0,.04);}
        .product-img-wrap{width:100%;aspect-ratio:1/1;background:var(--bg2);display:flex;align-items:center;justify-content:center;overflow:hidden;}
        .product-img{width:100%;height:100%;object-fit:cover;}
        .product-img-placeholder{font-size:32px;opacity:.3;}
        .product-info{padding:10px;flex:1;display:flex;flex-direction:column;gap:4px;}
        .product-name{font-size:13px;font-weight:600;color:var(--txt);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:36px;}
        .product-agent{font-size:11px;color:var(--txt3);}
        .product-bottom{display:flex;align-items:baseline;gap:2px;margin-top:auto;}
        .product-price{font-size:15px;font-weight:800;color:var(--yellow);}
        .product-unit{font-size:10px;color:var(--txt3);}

        .noti-item{padding:12px;border-bottom:1px solid var(--bdr);display:flex;gap:12px;cursor:pointer;}
        .noti-item.unread{background:var(--green3);}
        .noti-ic{width:36px;height:36px;border-radius:50%;background:var(--bg2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px;}
        .noti-body{flex:1;min-width:0;}
        .noti-t{font-size:13px;font-weight:700;color:var(--txt);}
        .noti-b{font-size:12px;color:var(--txt2);margin-top:2px;line-height:1.4;}
        .noti-time{font-size:10px;color:var(--txt3);margin-top:4px;}

        .main{padding:12px 14px;display:flex;flex-direction:column;gap:12px;}

        .ad{background:linear-gradient(135deg,#fff8e1,#fffde7);border:1.5px solid #ffe082;border-radius:var(--r);padding:12px 14px;position:relative;animation:fadeDown .35s ease;}
        .ad-lbl{font-size:9px;letter-spacing:1.5px;color:#f57f17;font-family:'JetBrains Mono',monospace;margin-bottom:8px;font-weight:600;}
        .ad-body{display:flex;align-items:center;gap:10px;}
        .ad-icon{font-size:26px;flex-shrink:0;}
        .ad-copy h4{font-size:13px;font-weight:700;color:#1a2e1a;}
        .ad-copy p{font-size:12px;color:#5d4037;margin-top:2px;}
        .ad-x{position:absolute;top:8px;right:10px;background:none;border:none;color:#bca058;font-size:16px;cursor:pointer;padding:4px;-webkit-tap-highlight-color:transparent;}

        .card{background:var(--surf);border:1.5px solid var(--bdr);border-radius:var(--r);padding:16px;box-shadow:0 2px 8px rgba(46,125,50,0.06);}
        .asset-row{display:flex;align-items:center;gap:12px;}
        .av{width:46px;height:46px;flex-shrink:0;border-radius:50%;background:linear-gradient(135deg,var(--green),var(--green2));display:flex;align-items:center;justify-content:center;font-size:19px;font-weight:800;color:#fff;box-shadow:0 3px 10px rgba(46,125,50,0.3);}
        .asset-meta{flex:1;min-width:0;}
        .asset-name{font-size:15px;font-weight:700;}
        .asset-live{font-size:11px;color:var(--txt2);margin-top:2px;display:flex;align-items:center;gap:4px;}
        .dot{width:6px;height:6px;background:var(--green2);border-radius:50%;animation:pulse 2s infinite;flex-shrink:0;}
        .asset-val{text-align:right;flex-shrink:0;}
        .big-num{font-size:20px;font-weight:800;font-family:'JetBrains Mono',monospace;letter-spacing:-.5px;white-space:nowrap;}
        .big-num small{font-size:12px;font-weight:400;color:var(--txt3);}
        .divider{height:1px;background:var(--bdr);margin:12px 0;}
        .kg-row{display:flex;align-items:center;justify-content:space-between;}
        .kg-lbl{font-size:13px;color:var(--txt2);}
        .kg-wrap{display:flex;align-items:center;gap:6px;}
        .kg-inp{width:90px;padding:7px 10px;background:var(--bg2);border:1.5px solid var(--bdr);border-radius:var(--rs);color:var(--txt);font-family:'JetBrains Mono',monospace;font-size:14px;text-align:right;outline:none;-webkit-appearance:none;}
        .kg-inp:focus{border-color:var(--green);}
        .kg-unit{font-size:12px;color:var(--txt3);}

        .tag-up  {color:var(--green);background:var(--green3);}
        .tag-down{color:var(--red);  background:var(--red2);}
        .tag-flat{color:var(--yellow);background:var(--yellow2);}

        .actions{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
        .act{background:var(--surf);border:1.5px solid var(--bdr);border-radius:var(--r);padding:14px 6px;cursor:pointer;text-align:center;-webkit-tap-highlight-color:transparent;display:flex;flex-direction:column;align-items:center;gap:6px;transition:border-color .2s,transform .15s;box-shadow:0 2px 8px rgba(46,125,50,0.06);}
        .act:active{transform:scale(.95);border-color:var(--green);}
        .act-icon{font-size:22px;}
        .act-lbl{font-size:12px;font-weight:600;color:var(--txt);line-height:1.3;}
        .act.dim{opacity:.35;pointer-events:none;}

        .ctabs{display:flex;gap:8px;margin-bottom:12px;}
        .ctab{flex:1;background:var(--bg2);border:1.5px solid var(--bdr);border-radius:var(--rs);padding:9px 4px;cursor:pointer;text-align:center;-webkit-tap-highlight-color:transparent;transition:all .2s;}
        .ctab.on{border-color:var(--green);background:var(--green3);}
        .ctab-n{font-size:13px;font-weight:700;color:var(--txt2);display:block;}
        .ctab.on .ctab-n{color:var(--green);}
        .ctab-sub{font-size:10px;color:var(--txt3);display:block;margin-top:2px;}

        .ag-hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 14px 10px;border-bottom:1px solid var(--bdr);}
        .ag-title{font-size:14px;font-weight:700;}
        .ag-sub{font-size:11px;color:var(--txt2);margin-top:2px;}
        .live{font-size:10px;font-family:'JetBrains Mono',monospace;color:var(--green2);display:flex;align-items:center;gap:4px;font-weight:700;}
        .ag-row{display:flex;align-items:center;gap:10px;padding:11px 14px;border-bottom:1px solid var(--bdr);-webkit-tap-highlight-color:transparent;transition:background .15s;}
        .ag-row:last-child{border-bottom:none;}
        .ag-row:active{background:var(--bg2);}
        .ag-rank{font-size:11px;color:var(--txt3);font-family:'JetBrains Mono',monospace;width:14px;flex-shrink:0;}
        .ag-av{width:34px;height:34px;background:var(--bg2);border:1px solid var(--bdr);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;}
        .ag-info{flex:1;min-width:0;}
        .ag-name{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .ag-loc{font-size:11px;color:var(--txt3);margin-top:1px;}
        .ag-prc{text-align:right;flex-shrink:0;}
        .ag-num{font-size:14px;font-weight:700;font-family:'JetBrains Mono',monospace;white-space:nowrap;}
        .ag-chg{font-size:11px;font-family:'JetBrains Mono',monospace;margin-top:2px;font-weight:600;}

        /* BOTTOM NAV */
        .bnav { position:fixed; bottom:0; padding-bottom:env(safe-area-inset-bottom); left:0; right:0; background:rgba(255,255,255,0.96); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border-top:1.5px solid var(--bdr); display:flex; z-index:99; box-shadow:0 -2px 12px rgba(46,125,50,0.06); }
        .bnav button { flex:1; background:none; border:none; padding:12px 0 10px; display:flex; flex-direction:column; align-items:center; gap:4px; color:var(--txt3); font-family:inherit; cursor:pointer; -webkit-tap-highlight-color:transparent; transition:color .2s; }
        .bnav button.on { color:var(--green); }
        .bnav-ic { font-size:22px; line-height:1; }
        .bnav-lbl { font-size:10px; font-weight:700; letter-spacing:.2px; }

        .overlay{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.5);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:flex-end;justify-content:center;animation:fadeIn .25s ease;}
        .modal{background:var(--surf);border:1.5px solid var(--bdr);border-radius:22px 22px 0 0;width:100%;max-width:480px;padding:20px 20px calc(28px + env(safe-area-inset-bottom));position:relative;animation:slideUp .3s ease;box-shadow:0 -8px 32px rgba(46,125,50,0.12);}
        .m-handle{width:36px;height:4px;background:var(--bdr2);border-radius:2px;margin:0 auto 18px;}
        .m-x{position:absolute;top:18px;right:16px;background:var(--bg2);border:1.5px solid var(--bdr);color:var(--txt2);width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent;}
        .m-logo{font-size:32px;text-align:center;}
        .m-title{font-size:19px;font-weight:800;text-align:center;margin:6px 0 4px;color:var(--green);}
        .m-sub{font-size:13px;color:var(--txt2);text-align:center;margin-bottom:20px;}
        .m-inp{width:100%;padding:13px 14px;background:var(--bg2);border:1.5px solid var(--bdr);border-radius:var(--rs);color:var(--txt);font-family:inherit;font-size:15px;outline:none;margin-bottom:10px;-webkit-appearance:none;transition:border-color .2s;}
        .m-inp:focus{border-color:var(--green);}
        .m-inp::placeholder{color:var(--txt3);}
        .m-btn{width:100%;padding:14px;background:var(--green);color:#fff;border:none;border-radius:var(--rs);font-family:inherit;font-size:15px;font-weight:700;cursor:pointer;margin-top:4px;-webkit-tap-highlight-color:transparent;box-shadow:0 4px 12px rgba(46,125,50,0.3);}
        .m-btn:active{opacity:.9;}
        .m-or{display:flex;align-items:center;gap:10px;color:var(--txt3);font-size:12px;margin:14px 0;}
        .m-or::before,.m-or::after{content:'';flex:1;height:1px;background:var(--bdr);}
        .m-reg{text-align:center;font-size:13px;color:var(--txt2);}
        .m-reg a{color:var(--green);font-weight:700;cursor:pointer;}

        @keyframes fadeUp  {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn  {from{opacity:0}to{opacity:1}}
        @keyframes slideUp {from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes pulse   {0%,100%{opacity:1}50%{opacity:.4}}
        .fu{animation:fadeUp .4s ease both;}
        .d1{animation-delay:.05s}.d2{animation-delay:.12s}.d3{animation-delay:.19s}.d4{animation-delay:.26s}
      `}</style>

      <div className="page">
        {/* TOPBAR */}
        <div className="tb">
          <div className="logo">NNS<small>Nông Nghiệp Số</small></div>
          <div className="sb">
            <span className="si">🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm đại lý, sản phẩm..." />
          </div>
          {isLoggedIn && (
            <button className="btn-bell" onClick={() => { setShowNotifications(true); fetchNotifications(); }}>
              <span>🔔</span>
              {unreadCount > 0 && <span className="bell-dot" />}
            </button>
          )}
          <button className="btn-bot" onClick={()=>navigate('/chat')}>🌿</button>
        </div>

        <div className="main">
          {activeTab === 'market' && (
            <>
              {/* AD */}
              {showAd && adData && adData.banner_title && (
                <div className="ad">
                  <div className="ad-lbl">QUẢNG CÁO</div>
                  <button className="ad-x" onClick={()=>setShowAd(false)}>✕</button>
                  <div className="ad-body">
                    <div className="ad-icon">🌱</div>
                    <div className="ad-copy">
                      <h4>{adData.banner_title}</h4>
                      <p>{adData.banner_body}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ASSET */}
              {isLoggedIn && (
                <div className="card fu d1">
                  <div className="asset-row">
                    <div className="av">{userName ? userName[0].toUpperCase() : 'U'}</div>
                    <div className="asset-meta">
                      <div className="asset-name">{userName || 'Người dùng'}</div>
                      <div className="asset-live"><span className="dot"/>Cập nhật {new Date().toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</div>
                    </div>
                    <div className="asset-val">
                      <div className="big-num">{fmt(total)}<small> đ</small></div>
                      <div style={{marginTop:3,textAlign:'right'}}><ChangeTag val={diff} suffix=" đ"/></div>
                    </div>
                  </div>
                </div>
              )}

              {/* ACTIONS */}
              <div className="actions fu d2">
                <button className="act"><span className="act-icon">📋</span><span className="act-lbl">Chốt cà phê</span></button>
                <button className="act" onClick={() => setActiveTab('shop')}><span className="act-icon">🛒</span><span className="act-lbl">Đặt mua phân</span></button>
                <button className="act dim"><span className="act-icon">⋯</span><span className="act-lbl">Sắp ra mắt</span></button>
              </div>

              {/* CHART CARD */}
              <div className="card fu d3">
                <div className="ctabs">
                  {Object.entries(TABS).map(([k,m]) => (
                    <button key={k} className={`ctab${tab===k?' on':''}`} onClick={()=>setTab(k)}>
                      <span className="ctab-n">{m.label}</span>
                      <span className="ctab-sub">{m.sub}</span>
                    </button>
                  ))}
                </div>
                <CoffeePriceDisplay
                  data={coffeePrice}
                  loading={coffeeLoading}
                  usdVnd={usdVnd}
                  vcbAt={vcbAt}
                  tab={tab}
                  onRefresh={loadCoffeePrice}
                />
              </div>

              {/* AGENTS */}
              <div className="card fu d4" style={{padding:0}}>
                <div className="ag-hdr">
                  <div><div className="ag-title">Đại lý gần bạn</div><div className="ag-sub">Sắp xếp theo giá cao nhất</div></div>
                  <div className="live"><span className="dot"/>LIVE</div>
                </div>
                {agentsLoading && <div style={{textAlign:'center',padding:'20px',color:'#888',fontSize:13}}>⏳ Đang tải...</div>}
                {locationErr && <div style={{textAlign:'center',padding:'12px',color:'#c62828',fontSize:12}}>⚠ {locationErr}</div>}
                {!agentsLoading && agents.length === 0 && !locationErr && (
                  <div style={{textAlign:'center',padding:'20px',color:'#888',fontSize:13}}>Chưa có đại lý nào</div>
                )}
                {agents
                  .filter(a => a.name?.toLowerCase().includes(search.toLowerCase()) || (a.address||'').toLowerCase().includes(search.toLowerCase()))
                  .sort((a, b) => (b.price || 0) - (a.price || 0))
                  .slice(0, 10)
                  .map((a,i) => {
                    const c = a.change>0?'tag-up':a.change<0?'tag-down':'tag-flat'
                    const arrow = a.change>0?'▲+':a.change<0?'▼':'─'
                    return (
                      <div key={a._id || i} className="ag-row" onClick={()=>navigate(`/agent/${a._id}`)} style={{cursor:'pointer'}}>
                        <div className="ag-rank">{i+1}</div>
                        <div className="ag-av">🏪</div>
                        <div className="ag-info">
                          <div className="ag-name">{a.name}</div>
                          <div className="ag-loc">📍 {a.address||a.loc||'Lâm Đồng'}{a.distance ? ` · ${a.distance}km` : ''}</div>
                        </div>
                        <div className="ag-prc">
                          <div className={`ag-num ${c}`}>{a.price>0?fmt(a.price)+'đ':'—'}</div>
                          {a.change!==0 && <div className={`ag-chg ${c}`}>{arrow}{fmt(Math.abs(a.change||0))}</div>}
                        </div>
                      </div>
                    )
                  })
                }
                {agents.filter(a => a.name?.toLowerCase().includes(search.toLowerCase()) || (a.address||'').toLowerCase().includes(search.toLowerCase())).length > 10 && (
                  <button 
                    style={{width:'100%', padding: '14px', background: 'var(--bg2)', border: 'none', color: 'var(--green)', fontWeight: 700, borderBottomLeftRadius:'var(--r)', borderBottomRightRadius:'var(--r)', cursor: 'pointer', fontFamily:'inherit', borderTop:'1px solid var(--bdr)'}} 
                    onClick={() => { setActiveTab('agents-list'); window.scrollTo(0,0); }}
                  >
                    Xem tất cả đại lý ➔
                  </button>
                )}
              </div>
            </>
          )}

          {activeTab === 'agents-list' && (
            <div className="fu d1">
              <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:16}}>
                <button onClick={() => setActiveTab('market')} style={{background:'var(--surf)',border:'1px solid var(--bdr)',borderRadius:8,width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,cursor:'pointer',color:'var(--txt)'}}>←</button>
                <h3 style={{fontSize:18}}>Tất cả đại lý</h3>
              </div>
              <div className="card" style={{padding:0}}>
                {agents
                  .filter(a => a.name?.toLowerCase().includes(search.toLowerCase()) || (a.address||'').toLowerCase().includes(search.toLowerCase()))
                  .sort((a, b) => (b.price || 0) - (a.price || 0))
                  .map((a,i) => {
                    const c = a.change>0?'tag-up':a.change<0?'tag-down':'tag-flat'
                    const arrow = a.change>0?'▲+':a.change<0?'▼':'─'
                    return (
                      <div key={a._id || i} className="ag-row" onClick={()=>navigate(`/agent/${a._id}`)} style={{cursor:'pointer'}}>
                        <div className="ag-rank">{i+1}</div>
                        <div className="ag-av">🏪</div>
                        <div className="ag-info">
                          <div className="ag-name">{a.name}</div>
                          <div className="ag-loc">📍 {a.address||a.loc||'Lâm Đồng'}{a.distance ? ` · ${a.distance}km` : ''}</div>
                        </div>
                        <div className="ag-prc">
                          <div className={`ag-num ${c}`}>{a.price>0?fmt(a.price)+'đ':'—'}</div>
                          {a.change!==0 && <div className={`ag-chg ${c}`}>{arrow}{fmt(Math.abs(a.change||0))}</div>}
                        </div>
                      </div>
                    )
                })}
              </div>
            </div>
          )}

          {activeTab === 'shop' && <ShopTab agents={agents} />}
          {activeTab === 'assets' && <AssetsTab kg={kg} setKg={setKg} />}
          {activeTab === 'settings' && <SettingsTab isLoggedIn={isLoggedIn} userName={userName} onLogout={handleLogout} onLoginClick={()=>setShowLogin(true)} />}

        </div>
      </div>

      {/* BOTTOM NAV */}
      <div className="bnav">
        <button className={activeTab === 'market' ? 'on' : ''} onClick={() => setActiveTab('market')}>
          <span className="bnav-ic">📈</span>
          <span className="bnav-lbl">Thị trường</span>
        </button>
        <button className={activeTab === 'shop' ? 'on' : ''} onClick={() => setActiveTab('shop')}>
          <span className="bnav-ic">🛒</span>
          <span className="bnav-lbl">Mua sắm</span>
        </button>
        <button className={activeTab === 'assets' ? 'on' : ''} onClick={() => setActiveTab('assets')}>
          <span className="bnav-ic">💼</span>
          <span className="bnav-lbl">Tài sản</span>
        </button>
        <button className={activeTab === 'settings' ? 'on' : ''} onClick={() => setActiveTab('settings')}>
          <span className="bnav-ic">⚙️</span>
          <span className="bnav-lbl">Cài đặt</span>
        </button>
      </div>

      {/* POPUP AD */}
      {adData && adData.popup_enabled && showPopup && (
        <div className="overlay" style={{zIndex:300}} onClick={e=>{if(e.target===e.currentTarget){setShowPopup(false);sessionStorage.setItem('nns_ad_seen','1')}}}>
          <div className="modal" style={{paddingBottom: 30}}>
            <button className="m-x" onClick={()=>{setShowPopup(false); sessionStorage.setItem('nns_ad_seen','1')}}>✕</button>
            <div className="m-logo" style={{fontSize:40,marginBottom:10}}>📢</div>
            <div className="m-title" style={{color:'var(--green)'}}>{adData.popup_title}</div>
            <div className="m-sub" style={{marginBottom: 20}}>{adData.popup_body}</div>
            <button className="m-btn" onClick={()=>{setShowPopup(false); sessionStorage.setItem('nns_ad_seen','1')}}>Đóng thông báo</button>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS MODAL */}
      {showNotifications && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowNotifications(false)}>
          <div className="modal" style={{maxHeight:'80dvh',display:'flex',flexDirection:'column'}}>
            <div className="m-handle" />
            <div style={{padding:'20px 20px 10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h3 style={{fontSize:18}}>Thông báo</h3>
              <button className="m-x" style={{position:'static'}} onClick={()=>setShowNotifications(false)}>✕</button>
            </div>
            <div style={{flex:1,overflowY:'auto',paddingBottom:20}}>
              {notifications.length === 0 ? (
                <div style={{textAlign:'center',padding:'40px 20px',color:'var(--txt3)'}}>
                  <div style={{fontSize:40,marginBottom:10}}>🔔</div>
                  <div style={{fontSize:14}}>Chưa có thông báo nào</div>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n._id} className={`noti-item ${n.read ? '' : 'unread'}`} onClick={() => { markAsRead(n._id); navigate(`/agent/${n.agent_id}`); setShowNotifications(false); }}>
                    <div className="noti-ic">{n.type === 'price_update' ? '📈' : '📦'}</div>
                    <div className="noti-body">
                      <div className="noti-t">{n.title}</div>
                      <div className="noti-b">{n.body}</div>
                      <div className="noti-time">{toVN(n.at)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS MODAL */}
      {showNotifications && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowNotifications(false)}>
          <div className="modal" style={{maxHeight:'80dvh',display:'flex',flexDirection:'column'}}>
            <div className="m-handle" />
            <div style={{padding:'20px 20px 10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h3 style={{fontSize:18}}>Thông báo</h3>
              <button className="m-x" style={{position:'static'}} onClick={()=>setShowNotifications(false)}>✕</button>
            </div>
            <div style={{flex:1,overflowY:'auto',paddingBottom:20}}>
              {notifications.length === 0 ? (
                <div style={{textAlign:'center',padding:'40px 20px',color:'var(--txt3)'}}>
                  <div style={{fontSize:40,marginBottom:10}}>🔔</div>
                  <div style={{fontSize:14}}>Chưa có thông báo nào</div>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n._id} className={`noti-item ${n.read ? '' : 'unread'}`} onClick={() => { markAsRead(n._id); navigate(`/agent/${n.agent_id}`); setShowNotifications(false); }}>
                    <div className="noti-ic">{n.type === 'price_update' ? '📈' : '📦'}</div>
                    <div className="noti-body">
                      <div className="noti-t">{n.title}</div>
                      <div className="noti-b">{n.body}</div>
                      <div className="noti-time">{n.at}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {showLogin && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowLogin(false)}>
          <div className="modal">
            <div className="m-handle"/>
            <button className="m-x" onClick={()=>setShowLogin(false)}>✕</button>
            <div className="m-logo">☕</div>
            <div className="m-title">{isRegistering ? 'Tạo tài khoản NNS' : 'Đăng nhập NNS'}</div>
            <div className="m-sub">Theo dõi tài sản & nhận thông báo giá ngay lập tức</div>
            
            {loginErr && <div style={{color:loginErr.includes('✅')?'var(--green)':'var(--red)', fontSize:13, marginBottom:10, textAlign:'center', background:loginErr.includes('✅')?'var(--green3)':'var(--red2)', padding:8, borderRadius:8}}>{loginErr}</div>}
            
            {isRegistering && (
              <input className="m-inp" placeholder="Họ và tên" value={regName} onChange={e=>setRegName(e.target.value)} />
            )}
            <input className="m-inp" placeholder="Số điện thoại" inputMode="tel" value={loginPhone} onChange={e=>setLoginPhone(e.target.value)} />
            <input className="m-inp" placeholder="Mật khẩu" type="password" value={loginPass} onChange={e=>setLoginPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(isRegistering?submitRegister():submitLogin())}/>
            
            <button className="m-btn" onClick={isRegistering?submitRegister:submitLogin} disabled={loginLoading}>
              {loginLoading ? 'Đang xử lý...' : (isRegistering ? 'Tham gia ngay' : '🌱 Đăng nhập')}
            </button>
            <div className="m-or">hoặc</div>
            <div className="m-reg">
              {isRegistering ? (
                <>Đã có tài khoản? <a onClick={()=>{setIsRegistering(false); setLoginErr('')}}>Đăng nhập</a></>
              ) : (
                <>Chưa có tài khoản? <a onClick={()=>{setIsRegistering(true); setLoginErr('')}}>Đăng ký ngay</a></>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
