const toVN = s => s ? new Date((s+'').endsWith('Z')||(s+'').includes('+') ? s : s+'Z').toLocaleString('vi-VN') : '';
import { useState, useEffect, useCallback, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Spinner from './Spinner'
import useSwipeBack from './useSwipeBack'
import usePullToRefresh from './usePullToRefresh'

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
  return outputArray;
}
const API = 'https://api.nns.id.vn'
const TOKEN_KEY = 'agent_token'

// Set manifest PWA riêng cho agent
;(()=>{
  if (!window.location.pathname.startsWith('/agent')) return
  const el = document.querySelector('link[rel="manifest"]')
  if (el) el.href = '/agent-manifest.json'
  else {
    const l = document.createElement('link')
    l.rel = 'manifest'; l.href = '/agent-manifest.json'
    document.head.appendChild(l)
  }
  const tc = document.querySelector('meta[name="theme-color"]')
  if (tc) tc.content = '#0d47a1'
})()

// Set manifest cho PWA
const link = document.createElement('link')
link.rel = 'manifest'
link.href = '/agent-manifest.json'
document.head.appendChild(link)
const fmt = n => n?.toLocaleString('vi-VN') ?? '—'

function PinInput({ onConfirm, onCancel, loading }) {
  const [pin, setPin] = useState('')
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'#fff',borderRadius:20,padding:28,width:'100%',maxWidth:340,textAlign:'center'}}>
        <div style={{fontSize:32,marginBottom:8}}>🔐</div>
        <div style={{fontWeight:700,fontSize:17,marginBottom:4,color:'#0d47a1'}}>Xác nhận PIN</div>
        <div style={{fontSize:13,color:'#666',marginBottom:20}}>Nhập mã PIN 6 số để xác nhận</div>
        <input autoFocus type="password" inputMode="numeric" maxLength={6}
          value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,''))}
          style={{width:'100%',padding:'14px',borderRadius:12,border:'2px solid #1565c0',fontSize:22,textAlign:'center',letterSpacing:8,boxSizing:'border-box',outline:'none',fontFamily:'monospace'}}
          placeholder="••••••"/>
        <div style={{display:'flex',gap:10,marginTop:16}}>
          <button onClick={onCancel} style={{flex:1,padding:'12px',borderRadius:10,border:'1.5px solid #ddd',background:'#f5f5f5',fontWeight:600,fontSize:14,cursor:'pointer'}}>Hủy</button>
          <button onClick={()=>onConfirm(pin)} disabled={pin.length!==6||loading}
            style={{flex:1,padding:'12px',borderRadius:10,border:'none',background:pin.length===6?'#1565c0':'#90caf9',color:'#fff',fontWeight:700,fontSize:14,cursor:'pointer'}}>
            {loading?'...':'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AgentPage() {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY))
  const [agent, setAgent] = useState(null)
  const [screen, setScreen] = useState('login')
  const [locked, setLocked] = useState(false)
  const [splash, setSplash] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 1500)
    return () => clearTimeout(t)
  }, [])

  const handleSwipeBack = useCallback(() => {
    if (screen !== 'home' && screen !== 'login') setScreen('home')
  }, [screen])
  useSwipeBack(handleSwipeBack, screen !== 'home' && screen !== 'login')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [price, setPrice] = useState('')
  const [priceNote, setPriceNote] = useState('')
  const [profileForm, setProfileForm] = useState({})
  const [productForm, setProductForm] = useState({name:'',category:'phan_bon',price:'',unit:'kg',description:''})
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [saved, setSaved] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [pinAction, setPinAction] = useState(null)
  const [catalog, setCatalog] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [priceTable, setPriceTable] = useState([])
  const [allAgents, setAllAgents] = useState([])
  const [pushStatus, setPushStatus] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'denied')

  const subscribePush = async (jwtToken) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const pk = "BBnjqdVwXti2bEQsrrBsZAy_xYS4OR0oQnt-HvSm_Z8PIInaXzRlSlj7vwDwXxNWzXWOnAAmIPdCaMbsX1IqrwM";
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(pk) });
      }
      await fetch(`${API}/agent/push-subscribe`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwtToken}` },
        body: JSON.stringify(sub)
      });
    } catch(e) { console.log('Push err', e) }
  }

  const askPush = async () => {
    const perm = await Notification.requestPermission()
    setPushStatus(perm)
    if (perm === 'granted') subscribePush(token)
  }

  useEffect(() => {
    if (token) {
      fetchMe()
      if (pushStatus === 'granted') subscribePush(token)
      else if (pushStatus === 'default') {
        // Tự hỏi quyền sau 2 giây khi đăng nhập
        setTimeout(() => {
          Notification.requestPermission().then(perm => {
            setPushStatus(perm)
            if (perm === 'granted') subscribePush(token)
          }).catch(() => {})
        }, 2000)
      }
    }
  }, [token])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  usePullToRefresh(useCallback(()=>{ if(token) fetchMe() },[token]), !!token)

  // Poll trạng thái mỗi 30s — nếu bị khóa sẽ văng ra ngay
  useEffect(() => {
    if (!token) return
    const id = setInterval(() => fetchMe(), 30000)
    return () => clearInterval(id)
  }, [token])

  // WebSocket — lắng nghe event bị khóa, văng ra ngay lập tức
  useEffect(() => {
    if (!token || !agent) return
    const ws = new WebSocket('wss://api.nns.id.vn/ws/prices')
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'agent_locked' && msg.agent_id === agent._id) {
          setLocked(true)
        }
      } catch {}
    }
    return () => ws.close()
  }, [token, agent?._id])

  const fetchMe = async () => {
    try {
      const r = await fetch(`${API}/agent/me`, {headers:{Authorization:`Bearer ${token}`}})
      if (r.status === 403) { setLocked(true); return }
      if (!r.ok) { logout(); return }
      const d = await r.json()
      setAgent(d)
      setProfileForm({name:d.name||'',address:d.address||'',phone:d.phone||'',phone2:d.phone2||'',zalo:d.zalo||'',email:d.email||'',facebook:d.facebook||''})
      setPriceTable(d.price_table||[])
      setScreen(prev => (prev === 'login' || prev === 'register') ? 'home' : prev)
    } catch { logout() }
  }

  const fetchAllAgents = async () => {
    try {
      const r = await fetch(`${API}/agents`)
      if (r.ok) setAllAgents(await r.json())
    } catch {}
  }

  useEffect(() => { fetchAllAgents() }, [])

  const validAgents = useMemo(() => allAgents.filter(a => a.price > 0), [allAgents])
  const avgPrice = useMemo(() => validAgents.length > 0 ? Math.round(validAgents.reduce((s,a) => s+(a.price||0), 0) / validAgents.length) : 0, [validAgents])
  const domesticHistory = useMemo(() => {
    const agentsWithHist = validAgents.filter(a => a.price_history && a.price_history.length > 0)
    if (agentsWithHist.length === 0) return []
    const byDate = {}
    agentsWithHist.forEach(a => {
      a.price_history.forEach(h => {
        const date = new Date((h.at+'').endsWith('Z')||(h.at+'').includes('+') ? h.at : h.at+'Z')
        const key = date.toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit'})
        if (!byDate[key]) byDate[key] = []
        byDate[key].push(h.price)
      })
    })
    return Object.entries(byDate).map(([time, prices]) => ({
      time,
      price: Math.round(prices.reduce((s,p)=>s+p,0) / prices.length)
    })).slice(-30)
  }, [validAgents])

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null); setAgent(null); setScreen('login')
  }

  const doAuth = async () => {
    setError(''); setLoading(true)
    try {
      if (screen === 'register') {
        const r = await fetch(`${API}/agent/register`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({phone, password})
        })
        const d = await r.json()
        if (r.status === 403) { setLocked(true); setLoading(false); return }
        if (!r.ok) { setError(d.detail||'Loi'); setLoading(false); return }
        await fetch(`${API}/agent/set-pin`, {
          method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${d.access_token}`},
          body: JSON.stringify({pin})
        })
        localStorage.setItem(TOKEN_KEY, d.access_token)
        setToken(d.access_token)
      } else {
        const r = await fetch(`${API}/agent/login`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({phone, password})
        })
        const d = await r.json()
        if (r.status === 403) { setLocked(true); setLoading(false); return }
        if (!r.ok) { setError(d.detail||'Loi'); setLoading(false); return }
        localStorage.setItem(TOKEN_KEY, d.access_token)
        setToken(d.access_token)
      }
    } catch { setError('Khong ket noi duoc server') }
    setLoading(false)
  }

  const requirePin = (action) => { setPinAction(()=>action); setShowPin(true) }

  const handlePinConfirm = async (enteredPin) => {
    setLoading(true)
    try {
      const r = await fetch(`${API}/agent/verify-pin`, {
        method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
        body: JSON.stringify({pin: enteredPin})
      })
      if (!r.ok) { setError('PIN không đúng'); setShowPin(false); setLoading(false); return }
      setShowPin(false)
      await pinAction()
    } catch { setError('Lỗi xác thực PIN') }
    setLoading(false)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const savePriceTable = async (items) => {
    const r = await fetch(`${API}/agent/price-table`, {
      method:'PUT', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
      body: JSON.stringify({items})
    })
    if (r.ok) setSaved('✅ Đã lưu bảng giá!')
  }

  const doUpdatePrice = async () => {
    const r = await fetch(`${API}/agent/price`, {
      method:'PUT', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
      body: JSON.stringify({price:parseInt(price), note:priceNote})
    })
    if (r.ok) { setSaved('✅ Đã cập nhật giá!'); fetchMe(); setPrice(''); setPriceNote('') }
  }

  const updateProfile = async () => {
    setLoading(true)
    const r = await fetch(`${API}/agent/profile`, {
      method:'PUT', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
      body: JSON.stringify(profileForm)
    })
    if (r.ok) { setSaved('✅ Đã lưu thông tin!'); fetchMe() }
    setLoading(false)
  }

  const addProduct = async () => {
    setLoading(true)
    setError('')
    try {
      let image_url = null
      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)
        const res = await fetch(`${API}/agent/upload-image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        })
        const d = await res.json()
        if (d.url) image_url = d.url
      }

      const r = await fetch(`${API}/agent/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...productForm, image_url, price: Number(productForm.price) })
      })
      if (r.ok) {
        setSaved('✅ Đã thêm sản phẩm!');
        setProductForm({ name: '', category: 'phan_bon', price: '', unit: 'kg', description: '' })
        setImageFile(null)
        setImagePreview(null)
        fetchMe()
      } else {
        const d = await r.json()
        setError(d.detail || 'Lỗi khi thêm sản phẩm')
      }
    } catch { setError('Lỗi kết nối server') }
    setLoading(false)
  }

  const fetchCatalog = async () => {
    setCatalogLoading(true)
    try {
      const r = await fetch(`${API}/catalog`)
      if (r.ok) setCatalog(await r.json())
    } catch {}
    setCatalogLoading(false)
  }

  const addFromCatalog = async (productId) => {
    const r = await fetch(`${API}/agent/catalog/${productId}/add`, {method:'POST', headers:{Authorization:`Bearer ${token}`}})
    const d = await r.json()
    if (r.ok) { setSaved('✅ Đã thêm sản phẩm!'); fetchMe() }
    else setSaved('⚠ ' + (d.detail || 'Lỗi'))
  }

  const removeFromCatalog = async (productId) => {
    await fetch(`${API}/agent/catalog/${productId}/remove`, {method:'DELETE', headers:{Authorization:`Bearer ${token}`}})
    setSaved('✅ Đã xóa sản phẩm!')
    fetchMe()
  }

  const deleteProduct = async (id) => {
    await fetch(`${API}/agent/products/${id}`, {method:'DELETE', headers:{Authorization:`Bearer ${token}`}})
    fetchMe()
  }

  const blue = '#1565c0'
  const s = {
wrap: {minHeight:'100dvh',background:'#0d47a1',fontFamily:"'Be Vietnam Pro',sans-serif",paddingBottom:'env(safe-area-inset-bottom)'},
hdr: {padding:'calc(env(safe-area-inset-top) + 16px) 18px 10px',display:'flex',alignItems:'center',justifyContent:'space-between'},
    card: {background:'#fff',borderRadius:16,padding:20,margin:'0 12px 12px',boxShadow:'0 2px 12px rgba(0,0,0,.15)'},
    inp: {width:'100%',padding:'13px 15px',borderRadius:12,border:'1.5px solid #dde3f0',fontSize:14,marginBottom:10,boxSizing:'border-box',outline:'none',background:'#f8faff',fontFamily:'inherit'},
    btn: {width:'100%',padding:'14px',borderRadius:12,background:'linear-gradient(135deg,#1565c0,#1976d2)',color:'#fff',fontWeight:700,fontSize:15,border:'none',cursor:'pointer'},
    select: {width:'100%',padding:'13px 15px',borderRadius:12,border:'1.5px solid #dde3f0',fontSize:14,marginBottom:10,boxSizing:'border-box',background:'#f8faff'},
    textarea: {width:'100%',padding:'13px 15px',borderRadius:12,border:'1.5px solid #dde3f0',fontSize:13,marginBottom:10,boxSizing:'border-box',minHeight:80,resize:'vertical',fontFamily:'inherit',background:'#f8faff'},
  }

  // SPLASH
  if (splash) return (
    <div style={{minHeight:'100dvh', background:'#0d47a1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Be Vietnam Pro',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`@keyframes pulse {0%, 100% {transform: scale(1); opacity:1} 50% {transform: scale(1.05); opacity:0.85}}`}</style>
      <img src="/icon-agent-192.png" alt="NNS Agent Logo" style={{width:96,height:96,borderRadius:24,boxShadow:'0 8px 24px rgba(0,0,0,.3)',animation:'pulse 1.5s infinite', background:'#fff'}}/>
      <div style={{fontSize:26, fontWeight:800, color:'#fff', marginTop:24}}>NNS Đại lý</div>
      <div style={{fontSize:14, color:'rgba(255,255,255,0.7)', marginTop:6}}>Cổng quản lý đại lý cà phê</div>
    </div>
  )

  // LOCKED
  if (locked) return (
    <div style={{minHeight:'100vh',background:'#1a1a2e',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,fontFamily:"'Be Vietnam Pro',sans-serif"}}>
      <div style={{fontSize:64,marginBottom:16}}>🔒</div>
      <div style={{fontWeight:800,fontSize:20,color:'#fff',marginBottom:8,textAlign:'center'}}>Tài khoản bị khóa</div>
      <div style={{fontSize:14,color:'rgba(255,255,255,.7)',textAlign:'center',marginBottom:32,lineHeight:1.6}}>
        Tài khoản của bạn đã bị khóa bởi quản trị viên.
      </div>
      <a href="tel:0963025264" style={{background:'#1565c0',color:'#fff',padding:'14px 28px',borderRadius:14,
        fontWeight:700,fontSize:16,textDecoration:'none',display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
        📞 Liên hệ 0963025264
      </a>
      <button onClick={()=>{setLocked(false);logout()}} style={{background:'transparent',border:'1px solid rgba(255,255,255,.3)',
        color:'rgba(255,255,255,.6)',padding:'10px 20px',borderRadius:10,cursor:'pointer',fontSize:13}}>
        Quay lại đăng nhập
      </button>
    </div>
  )

  // LOGIN
  if (!token || !agent) return (
    <div style={{...s.wrap,display:'flex',flexDirection:'column',justifyContent:'center',minHeight:'100vh',padding:'0 0 40px'}}>
      <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <div style={{textAlign:'center',padding:'40px 20px 24px'}}>
        <div style={{width:72,height:72,borderRadius:20,background:'rgba(255,255,255,.15)',margin:'0 auto 16px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36}}>🏪</div>
        <div style={{fontWeight:800,fontSize:24,color:'#fff'}}>NNS Đại lý</div>
        <div style={{fontSize:13,color:'rgba(255,255,255,.7)',marginTop:6}}>Cổng quản lý đại lý cà phê</div>
      </div>
      <div style={{background:'#fff',borderRadius:'24px 24px 0 0',padding:'28px 20px',flex:1,minHeight:400}}>
        <div style={{display:'flex',gap:8,marginBottom:20,background:'#f0f4ff',borderRadius:12,padding:4}}>
          {[['login','Đăng nhập'],['register','Kích hoạt']].map(([k,v])=>(
            <button key={k} onClick={()=>{setScreen(k);setError('')}}
              style={{flex:1,padding:'10px',borderRadius:10,border:'none',cursor:'pointer',fontWeight:700,fontSize:14,
                background:screen===k?blue:'transparent',color:screen===k?'#fff':'#666',transition:'all .2s'}}>
              {v}
            </button>
          ))}
        </div>
        {error && <div style={{color:'#c62828',fontSize:13,marginBottom:10,padding:'8px 12px',background:'#ffebee',borderRadius:8}}>⚠ {error}</div>}
        <div style={{fontSize:12,color:'#888',marginBottom:4}}>Số điện thoại</div>
        <input style={s.inp} placeholder="0900000000" value={phone} onChange={e=>setPhone(e.target.value)} type="tel" inputMode="numeric"/>
        <div style={{fontSize:12,color:'#888',marginBottom:4}}>Mật khẩu</div>
        <input style={s.inp} placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} type="password"/>
        {screen==='register' && <>
          <div style={{fontSize:12,color:'#888',marginBottom:4}}>Mã PIN 6 số <span style={{color:blue}}>(xác nhận giao dịch)</span></div>
          <input style={{...s.inp,letterSpacing:8,textAlign:'center',fontFamily:'monospace',fontSize:18}} placeholder="••••••"
            value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,''))} type="password" inputMode="numeric" maxLength={6}/>
          <div style={{fontSize:11,color:'#aaa',marginBottom:10,textAlign:'center'}}>Chỉ SĐT đã đăng ký trong hệ thống NNS mới kích hoạt được</div>
        </>}
        <button style={s.btn} onClick={doAuth}
          disabled={loading||!phone||!password||(screen==='register'&&pin.length!==6)}>
          {loading?'Đang xử lý...' : screen==='login'?'🔑 Đăng nhập':'✅ Kích hoạt tài khoản'}
        </button>
      </div>
    </div>
  )

  // TILES HOME
  const tiles = [
    {id:'price',  icon:'💰', label:'Quản lý giá',      color:'#1565c0', bg:'#e3f2fd'},
    {id:'shop',   icon:'🏪', label:'Quản lý cửa hàng', color:'#2e7d32', bg:'#e8f5e9'},
    {id:'orders', icon:'📊', label:'Giao dịch',         color:'#6a1b9a', bg:'#f3e5f5'},
    {id:'profile',icon:'👤', label:'Xem trang cá nhân', color:'#e65100', bg:'#fff3e0'},
    {id:'info',   icon:'✏️', label:'Thông tin',          color:'#00695c', bg:'#e0f2f1'},
    {id:'ads',    icon:'📢', label:'Quảng cáo',          color:'#c62828', bg:'#ffebee'},
  ]

  return (
    <div style={s.wrap}>
      <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      {showPin && <PinInput onConfirm={handlePinConfirm} onCancel={()=>setShowPin(false)} loading={loading}/>}

      {/* HEADER */}
      <div style={s.hdr}>
        <div>
          <div style={{fontWeight:800,fontSize:17,color:'#fff'}}>🏢 NNS Đại lý</div>
          <div style={{fontSize:12,color:'rgba(255,255,255,.7)',marginTop:2}}>{agent.name}</div>
        </div>
        <button onClick={logout} style={{background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.25)',color:'#fff',padding:'7px 13px',borderRadius:10,cursor:'pointer',fontSize:13,fontWeight:600}}>Đăng xuất</button>
      </div>

      {screen==='home' && (
        <div style={{padding:'0 12px 20px'}}>
          {pushStatus !== 'granted' && (
            <div style={{background:pushStatus==='denied'?'#ffebee':'#fff3e0',borderRadius:12,padding:'12px',marginBottom:12,border:`1px solid ${pushStatus==='denied'?'#ffcdd2':'#ffe0b2'}`,display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
              <div style={{fontSize:13,color:pushStatus==='denied'?'#c62828':'#e65100',fontWeight:600,flex:1}}>
                {pushStatus==='default' && '🔔 Bật thông báo để nhận lịch giá'}
                {pushStatus==='denied' && '⚠️ Thông báo bị chặn — Vào Cài đặt trình duyệt để mở lại'}
              </div>
              {pushStatus==='default' && <button onClick={askPush} style={{background:'#e65100',color:'#fff',border:'none',padding:'6px 12px',borderRadius:8,fontWeight:700,fontSize:12,cursor:'pointer',whiteSpace:'nowrap'}}>Bật ngay</button>}
            </div>
          )}
          {/* STATUS TILE - full width */}
          <div style={{background:'rgba(255,255,255,.12)',borderRadius:18,padding:'20px 22px',marginBottom:12,border:'1px solid rgba(255,255,255,.15)'}}>
            <div style={{fontSize:12,color:'rgba(255,255,255,.7)',marginBottom:10,fontWeight:600,letterSpacing:.5}}>TRẠNG THÁI HÔM NAY</div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:11,color:'rgba(255,255,255,.6)'}}>Giá mua</div>
                <div style={{fontSize:28,fontWeight:800,color:'#fff',fontFamily:'monospace',letterSpacing:'-1px',marginTop:2}}>
                  {agent.price>0?fmt(agent.price)+'đ':'—'}
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:11,color:'rgba(255,255,255,.6)'}}>Lượt xem</div>
                <div style={{fontSize:28,fontWeight:800,color:'#64b5f6',fontFamily:'monospace',marginTop:2}}>{agent.views||0}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:11,color:'rgba(255,255,255,.6)'}}>Sản phẩm</div>
                <div style={{fontSize:28,fontWeight:800,color:'#a5d6a7',fontFamily:'monospace',marginTop:2}}>{(agent.products||[]).length}</div>
              </div>
            </div>
            {agent.price>0 && agent.price_history?.length>0 && (
              <div style={{marginTop:12,fontSize:11,color:'rgba(255,255,255,.5)'}}>
                Cập nhật lần cuối: {(() => { const d = new Date(((agent.price_history[agent.price_history.length-1]?.at||'')+'Z').replace('ZZ','Z')); const diff = Math.round((Date.now()-d)/60000); const ago = diff<60?diff+'p trước':diff<1440?Math.round(diff/60)+'h trước':Math.round(diff/1440)+'d trước'; return d.toLocaleString('vi-VN')+' ('+ago+')' })()}
              </div>
            )}
          </div>


          {/* BLOCK GIÁ TRUNG BÌNH TRONG NƯỚC */}
          {avgPrice > 0 && (() => {
            const first = domesticHistory[0]?.price || avgPrice
            const last  = domesticHistory[domesticHistory.length - 1]?.price || avgPrice
            const trend = last > first ? '#a5d6a7' : last < first ? '#ef9a9a' : '#fff9c4'
            return (
            <div style={{background:'rgba(0,0,0,.25)',borderRadius:18,padding:'16px 18px',marginBottom:12,border:'1px solid rgba(255,255,255,.1)'}}>
              <div style={{fontSize:11,color:'rgba(255,255,255,.7)',marginBottom:10,fontWeight:600,letterSpacing:.5}}>GIÁ TRUNG BÌNH TRONG NƯỚC</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <div>
                  <div style={{fontSize:28,fontWeight:800,color:'#fff',fontFamily:'monospace',letterSpacing:'-1px',lineHeight:1}}>
                    {avgPrice.toLocaleString('vi-VN')}
                    <span style={{fontSize:12,fontWeight:400,color:'rgba(255,255,255,.6)',marginLeft:4}}>đ/kg</span>
                  </div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,.5)',marginTop:4}}>{validAgents.length} đại lý · Trung bình</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:11,color:'rgba(255,255,255,.5)'}}>Xu hướng 30 ngày</div>
                  <div style={{fontSize:14,fontWeight:700,color:trend,marginTop:4}}>
                    {last > first ? '▲ Tăng' : last < first ? '▼ Giảm' : '= Ổn định'}
                  </div>
                </div>
              </div>
              {domesticHistory.length > 1 && (
                <div style={{marginTop:8,background:'rgba(0,0,0,.2)',borderRadius:10,padding:'8px 6px 4px'}}>
                  <div style={{fontSize:10,color:'rgba(255,255,255,.4)',marginBottom:4,paddingLeft:2}}>Lịch sử 30 ngày</div>
                  <ResponsiveContainer width="100%" height={70}>
                    <LineChart data={domesticHistory}>
                      <XAxis dataKey="time" tick={{fontSize:8,fill:'rgba(255,255,255,.4)'}} interval="preserveStartEnd" tickLine={false} axisLine={false}/>
                      <YAxis domain={['auto','auto']} tick={{fontSize:8,fill:'rgba(255,255,255,.4)'}} tickFormatter={v=>v/1000+'k'} tickLine={false} axisLine={false} width={28}/>
                      <Tooltip formatter={(v)=>[`${v.toLocaleString('vi-VN')}đ/kg`,'TB']} contentStyle={{fontSize:10,borderRadius:6,background:'#0d2a5e',border:'none',color:'#fff'}}/>
                      <Line type="monotone" dataKey="price" stroke={trend} strokeWidth={2} dot={false} activeDot={{r:3}}/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            )
          })()}

          {/* TILES GRID 2 cột */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {tiles.map(t=>(
              <button key={t.id} onClick={()=>{
                if(t.id==='profile'){ window.location.href=`/agent/${agent._id}`; return }
                setScreen(t.id);setSaved('');setError('')}}
                style={{background:t.bg,border:`2px solid ${t.color}22`,borderRadius:16,padding:'20px 16px',cursor:'pointer',textAlign:'left',transition:'transform .1s',aspectRatio:'1/0.9'}}>
                <div style={{fontSize:28,marginBottom:8}}>{t.icon}</div>
                <div style={{fontWeight:700,fontSize:14,color:t.color,lineHeight:1.2}}>{t.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SUB SCREENS */}
      {screen!=='home' && screen!=='login' && screen!=='register' && (
        <div style={{background:'#f0f4ff',minHeight:'calc(100vh - 60px)',borderRadius:'20px 20px 0 0',padding:'16px 0'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'0 16px 12px'}}>
            <button onClick={()=>{setScreen('home');setSaved('');setError('')}}
              style={{background:'#e3f2fd',border:'none',color:'#1565c0',padding:'8px 14px',borderRadius:10,cursor:'pointer',fontWeight:700,fontSize:13}}>
              ← Quay lại
            </button>
            <span style={{fontWeight:700,fontSize:15,color:'#0d47a1'}}>
              {tiles.find(t=>t.id===screen)?.icon} {tiles.find(t=>t.id===screen)?.label}
            </span>
          </div>

          {saved && <div style={{margin:'0 16px 10px',color:'#2e7d32',fontSize:13,padding:'8px 12px',background:'#e8f5e9',borderRadius:8,fontWeight:600}}>{saved}</div>}
          {error && <div style={{margin:'0 16px 10px',color:'#c62828',fontSize:13,padding:'8px 12px',background:'#ffebee',borderRadius:8}}>⚠ {error}</div>}

          {/* QUẢN LÝ GIÁ */}
          {screen==='price' && (
            <div>
              {/* BLOCK 1: CẬP NHẬT GIÁ CHÍNH */}
              <div style={{...s.card,margin:'0 12px 12px'}}>
                {(()=>{
                  const cur = parseInt(price)||agent.price||0
                  const orig = agent.price||0
                  const diff = price==='' ? 0 : cur - orig
                  const clr = price==='' ? '#f9a825' : diff>0 ? '#2e7d32' : diff<0 ? '#c62828' : '#f9a825'
                  return (
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                      <div style={{fontWeight:700,fontSize:14,color:'#1565c0'}}>💰 Giá mua chính</div>
                      {diff!==0 && (
                        <div style={{fontSize:12,fontWeight:700,color:clr,background:diff>0?'#e8f5e9':'#ffebee',
                          padding:'3px 10px',borderRadius:8,fontFamily:'monospace'}}>
                          {diff>0?'▲ +':'▼ '}{Math.abs(diff).toLocaleString('vi-VN')}đ
                        </div>
                      )}
                    </div>
                  )
                })()}
                {/* Dòng giá lớn + nút +/- */}
                {(()=>{
                  const cur = parseInt(price)||agent.price||0
                  const orig = agent.price||0
                  const diff = price==='' ? 0 : cur - orig
                  const clr = price==='' ? '#f9a825' : diff>0 ? '#2e7d32' : diff<0 ? '#c62828' : '#f9a825'
                  return (
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:12}}>
                      <button
                        onClick={()=>setPrice(p=>String(Math.max(0,(parseInt(p)||agent.price||0)-100)))}
                        style={{width:48,height:48,borderRadius:12,border:`2px solid ${clr}`,background:'#f5f5f5',
                          color:clr,fontSize:24,fontWeight:700,cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                      <div style={{flex:1,textAlign:'center'}}>
                        <div style={{fontSize:32,fontWeight:800,fontFamily:'monospace',color:clr,letterSpacing:'-1px',lineHeight:1,transition:'color .2s'}}>
                          {cur.toLocaleString('vi-VN')}
                        </div>
                        <div style={{fontSize:11,color:'#888',marginTop:4}}>đ/kg</div>
                      </div>
                      <button
                        onClick={()=>setPrice(p=>String((parseInt(p)||agent.price||0)+100))}
                        style={{width:48,height:48,borderRadius:12,border:`2px solid ${clr}`,background:'#f5f5f5',
                          color:clr,fontSize:24,fontWeight:700,cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
                    </div>
                  )
                })()}
                {/* Nút bút chì để nhập thủ công */}
                <div style={{textAlign:'center',marginBottom:14}}>
                  <button onClick={()=>{const v=prompt('Nhập giá cụ thể (đ/kg):');if(v&&!isNaN(v))setPrice(v)}}
                    style={{background:'none',border:'1px solid #bbb',borderRadius:8,padding:'5px 14px',
                      fontSize:12,color:'#666',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:6}}>
                    ✏️ Nhập tay
                  </button>
                </div>
                <div style={{background:'#fff8e1',borderRadius:10,padding:'10px 14px',marginBottom:14,fontSize:12,color:'#e65100',display:'flex',gap:8}}>
                  <span>🔐</span><span>Cần xác nhận PIN để cập nhật giá</span>
                </div>
                <button style={{...s.btn,
                  background: (parseInt(price)||0) !== agent.price
                    ? 'linear-gradient(135deg,#1565c0,#1976d2)'
                    : 'linear-gradient(135deg,#555,#777)'
                  }}
                  onClick={()=>requirePin(doUpdatePrice)}
                  disabled={loading}>
                  {(parseInt(price)||0) !== agent.price ? '💰 Cập nhật giá (yêu cầu PIN)' : '✅ Tiếp tục giữ giá thu mua hiện tại'}
                </button>
                {avgPrice > 0 && (
                  <button
                    style={{...s.btn,marginTop:8,background:'linear-gradient(135deg,#00695c,#00897b)'}}
                    onClick={()=>{
                      setPrice(String(avgPrice))
                      requirePin(()=>fetch(`${API}/agent/price`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({price:avgPrice,note:""})}).then(r=>{if(r.ok){setSaved("✅ Đã cập nhật theo giá TB!");fetchMe();setPrice("")}}))
                    }}>
                    Cập nhật theo TB thị trường ({fmt(avgPrice)}đ)
                  </button>
                )}
              </div>

              {/* BLOCK 2: BẢNG GIÁ */}
              <div style={{...s.card,margin:'0 12px 12px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                  <div style={{fontWeight:700,fontSize:14,color:'#1565c0'}}>📋 Bảng giá</div>
                  <button onClick={()=>setPriceTable(prev=>[...prev,{name:'',price:''}])}
                    style={{background:'#1565c0',border:'none',color:'#fff',width:32,height:32,borderRadius:8,fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>+</button>
                </div>
                {priceTable.length===0 && (
                  <div style={{textAlign:'center',padding:'16px 0',color:'#aaa',fontSize:13}}>Chưa có phân loại nào. Nhấn + để thêm.</div>
                )}
                {priceTable.map((item,i)=>(
                  <div key={i} style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
                    <input
                      style={{...s.inp,marginBottom:0,flex:2}}
                      placeholder="Tên phân loại (VD: Nhân xô)"
                      value={item.name}
                      onChange={e=>{const t=[...priceTable];t[i]={...t[i],name:e.target.value};setPriceTable(t)}}/>
                    <input
                      style={{...s.inp,marginBottom:0,flex:1}}
                      placeholder="Giá"
                      type="number" inputMode="numeric"
                      value={item.price}
                      onChange={e=>{const t=[...priceTable];t[i]={...t[i],price:e.target.value};setPriceTable(t)}}/>
                    <button onClick={()=>setPriceTable(prev=>prev.filter((_,j)=>j!==i))}
                      style={{background:'#ffebee',border:'none',color:'#c62828',width:32,height:32,borderRadius:8,fontSize:16,cursor:'pointer',flexShrink:0}}>🗑</button>
                  </div>
                ))}
                {priceTable.length>0 && (
                  <button style={{...s.btn,marginTop:4,background:'linear-gradient(135deg,#2e7d32,#388e3c)'}}
                    onClick={()=>savePriceTable(priceTable.map(i=>({name:i.name,price:parseInt(i.price)||0})).filter(i=>i.name))}
                    disabled={loading}>
                    💾 Lưu bảng giá
                  </button>
                )}
              </div>
            </div>
          )}

          {/* THÔNG TIN */}
          {(screen==='info'||screen==='profile') && (
            <div style={{...s.card,margin:'0 12px 12px'}}>
              {[['name','Tên đại lý'],['address','Địa chỉ'],['phone','SĐT chính'],['phone2','SĐT phụ'],['zalo','Zalo'],['email','Email'],['facebook','Facebook']].map(([k,v])=>(
                <div key={k}>
                  <div style={{fontSize:12,color:'#888',marginBottom:4}}>{v}</div>
                  <input style={s.inp} value={profileForm[k]||''} onChange={e=>setProfileForm({...profileForm,[k]:e.target.value})} placeholder={v}/>
                </div>
              ))}
              <button style={s.btn} onClick={updateProfile} disabled={loading}>{loading?'Đang lưu...':'💾 Lưu thông tin'}</button>
            </div>
          )}

          {/* CỬA HÀNG / SẢN PHẨM */}
          {/* CỬA HÀNG / SẢN PHẨM */}
          {screen==='shop' && (
            <div>
              <div style={{...s.card,margin:'0 12px 12px'}}>
                <div style={{fontWeight:700,fontSize:14,marginBottom:12,color:'#1565c0'}}>🏪 Sản phẩm đang bán ({(agent.products||[]).length})</div>
                {(agent.products||[]).length===0 && <div style={{textAlign:'center',padding:16,color:'#888',fontSize:13}}>Chưa có sản phẩm nào. Thêm từ danh mục bên dưới.</div>}
                {(agent.products||[]).map(p=>(
                  <div key={p.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid #eee'}}>
                    <div style={{width:48,height:48,background:'#f5f5f5',borderRadius:10,overflow:'hidden',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>
                      {p.image_url?<img src={p.image_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:'📦'}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:13,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.name}</div>
                      <div style={{fontSize:11,color:'#1565c0',marginTop:2}}>{fmt(p.price)}đ/{p.unit}</div>
                    </div>
                    <button onClick={()=>removeFromCatalog(p.id)} style={{background:'#ffebee',border:'none',color:'#c62828',padding:'8px 12px',borderRadius:10,cursor:'pointer',fontSize:16}}>🗑</button>
                  </div>
                ))}
              </div>
              <div style={{...s.card,margin:'0 12px 12px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                  <div style={{fontWeight:700,fontSize:14,color:'#2e7d32'}}>📦 Danh mục sản phẩm</div>
                  <button onClick={fetchCatalog} style={{background:'#e8f5e9',border:'none',color:'#2e7d32',padding:'6px 12px',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:700}}>↻ Tải lại</button>
                </div>
                {catalogLoading && <div style={{textAlign:'center',padding:16,color:'#888',fontSize:13}}>⏳ Đang tải...</div>}
                {!catalogLoading && catalog.length===0 && <div style={{textAlign:'center',padding:16,color:'#888',fontSize:13}}>Chưa có sản phẩm nào trong danh mục</div>}
                {catalog.map(p=>{
                  const added = (agent.products||[]).some(ap=>ap.id===p.id)
                  return (
                    <div key={p.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid #eee'}}>
                      <div style={{width:48,height:48,background:'#f5f5f5',borderRadius:10,overflow:'hidden',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>
                        {p.image_url?<img src={p.image_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:'📦'}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:13,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.name}</div>
                        <div style={{fontSize:11,color:'#1565c0',marginTop:2}}>{fmt(p.price)}đ/{p.unit}</div>
                        {p.description && <div style={{fontSize:11,color:'#888',marginTop:2}}>{p.description}</div>}
                      </div>
                      {added ? (
                        <div style={{background:'#e8f5e9',color:'#2e7d32',padding:'6px 10px',borderRadius:8,fontSize:11,fontWeight:700}}>✓ Đang bán</div>
                      ) : (
                        <button onClick={()=>addFromCatalog(p.id)} style={{background:'#1565c0',border:'none',color:'#fff',padding:'8px 12px',borderRadius:10,cursor:'pointer',fontSize:12,fontWeight:700}}>+ Thêm</button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {(screen==='orders'||screen==='ads') && (
            <div style={{textAlign:'center',padding:'60px 20px',color:'#888'}}>
              <div style={{fontSize:48,marginBottom:16}}>{tiles.find(t=>t.id===screen)?.icon}</div>
              <div style={{fontWeight:700,fontSize:16,color:'#333',marginBottom:8}}>{tiles.find(t=>t.id===screen)?.label}</div>
              <div style={{fontSize:13}}>Tính năng đang được phát triển...</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
