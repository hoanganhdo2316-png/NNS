const toVN = s => s ? new Date((s+'').endsWith('Z')||(s+'').includes('+') ? s : s+'Z').toLocaleString('vi-VN') : '';
import { useState, useEffect, useCallback } from 'react'
import Spinner from './Spinner'
import useSwipeBack from './useSwipeBack'
import usePullToRefresh from './usePullToRefresh'

const API = 'https://api.nns.id.vn'
const TOKEN_KEY = 'admin_token'

// Set manifest PWA riêng cho admin
;(()=>{
  if (!window.location.pathname.startsWith('/admin')) return
  const el = document.querySelector('link[rel="manifest"]')
  if (el) el.href = '/admin-manifest.json'
  else {
    const l = document.createElement('link')
    l.rel = 'manifest'; l.href = '/admin-manifest.json'
    document.head.appendChild(l)
  }
  const tc = document.querySelector('meta[name="theme-color"]')
  if (tc) tc.content = '#e65100'
})()
const orange = '#e65100'
const orange2 = '#fff3e0'
const fmt = n => n?.toLocaleString('vi-VN') ?? '—'

export default function AdminPage() {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY))
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [screen, setScreen] = useState('home')

  const handleSwipeBack = useCallback(() => {
    if (screen === 'agent_detail') setScreen('agents')
    else if (screen !== 'home') setScreen('home')
  }, [screen])
  useSwipeBack(handleSwipeBack, screen !== 'home')
  const [agents, setAgents] = useState([])
  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState([])
  const [ads, setAds] = useState({banner_title:'',banner_body:'',popup_title:'',popup_body:'',popup_enabled:false})
  const [traffic, setTraffic] = useState([])
  const [saved, setSaved] = useState('')
  const [newAgent, setNewAgent] = useState({name:'',address:'',phone:'',phone2:'',zalo:'',email:'',facebook:'',lat:'',lng:'',loc:'Lam Dong'})
  const [showAddAgent, setShowAddAgent] = useState(false)
  const [adminPrice, setAdminPrice] = useState('')
  const [adminPriceNote, setAdminPriceNote] = useState('')
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [agentLogs, setAgentLogs] = useState([])
  const [notifications, setNotifications] = useState([])
  const [showNoti, setShowNoti] = useState(false)

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  useEffect(() => {
    if (!token) return
    fetchAll()
  }, [token])

  usePullToRefresh(useCallback(()=>{ if(token) fetchAll() },[token]), !!token)

  const fetchAll = async () => {
    const safe = (p) => p.catch(() => null)
    const [a, u, l, ad, tr, nt] = await Promise.all([
      safe(fetch(`${API}/admin/agents`, {headers}).then(r=>r.ok?r.json():[])),
      safe(fetch(`${API}/admin/users`, {headers}).then(r=>r.ok?r.json():[])),
      safe(fetch(`${API}/admin/logs`, {headers}).then(r=>r.ok?r.json():[])),
      safe(fetch(`${API}/admin/ads`, {headers}).then(r=>r.ok?r.json():{})),
      safe(fetch(`${API}/admin/traffic`, {headers}).then(r=>r.ok?r.json():[])),
      safe(fetch(`${API}/admin/notifications`, {headers}).then(r=>r.ok?r.json():[])),
    ])
    if (Array.isArray(a)) setAgents(a)
    if (Array.isArray(u)) setUsers(u)
    if (Array.isArray(l)) setLogs(l)
    if (ad && typeof ad === 'object') setAds(ad)
    if (Array.isArray(tr)) setTraffic(tr)
    if (Array.isArray(nt)) setNotifications(nt)
  }

  const doLogin = async () => {
    setError(''); setLoading(true)
    try {
      const r = await fetch(`${API}/admin/login`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({password})
      })
      const d = await r.json()
      if (!r.ok) { setError(d.detail||'Sai mật khẩu'); setLoading(false); return }
      localStorage.setItem(TOKEN_KEY, d.access_token)
      setToken(d.access_token)
    } catch { setError('Không kết nối được server') }
    setLoading(false)
  }

  const logout = () => { localStorage.removeItem(TOKEN_KEY); setToken(null) }

  const lockAgent = async (id, name) => {
    if (!confirm(`Khóa/mở khóa đại lý ${name}?`)) return
    await fetch(`${API}/admin/agents/${id}/lock`, {method:'PUT', headers})
    fetchAll()
  }

  const lockUser = async (id, name) => {
    if (!confirm(`Khóa/mở khóa người dùng ${name}?`)) return
    await fetch(`${API}/admin/users/${id}/lock`, {method:'PUT', headers})
    fetchAll()
  }

  const addAgent = async () => {
    setLoading(true)
    const r = await fetch(`${API}/admin/agents`, {
      method:'POST', headers,
      body: JSON.stringify({...newAgent, lat:parseFloat(newAgent.lat), lng:parseFloat(newAgent.lng)})
    })
    if (r.ok) {
      setSaved('✅ Đã thêm đại lý!')
      setShowAddAgent(false)
      setNewAgent({name:'',address:'',phone:'',phone2:'',zalo:'',email:'',facebook:'',lat:'',lng:'',loc:'Lam Dong'})
      fetchAll()
    }
    setLoading(false)
  }

  const saveAds = async () => {
    setLoading(true)
    await fetch(`${API}/admin/ads`, {method:'PUT', headers, body:JSON.stringify(ads)})
    setSaved('✅ Đã lưu quảng cáo!')
    setLoading(false)
  }

  const updateAgentPrice = async () => {
    if (!adminPrice) return
    setLoading(true)
    const token_admin = localStorage.getItem(TOKEN_KEY)
    const r = await fetch(`${API}/admin/agents/${selectedAgent._id}/price`, {
      method:'PUT',
      headers:{'Content-Type':'application/json', Authorization:`Bearer ${token_admin}`},
      body: JSON.stringify({price: parseInt(adminPrice), note: adminPriceNote})
    })
    if (r.ok) {
      setSaved('✅ Đã cập nhật giá!')
      setAdminPrice('')
      setAdminPriceNote('')
      const updated = {...selectedAgent, price: parseInt(adminPrice)}
      setSelectedAgent(updated)
      fetchAll()
    }
    setLoading(false)
  }

  const openAgent = async (agent) => {
    setSelectedAgent(agent)
    setScreen('agent_detail')
    const r = await fetch(`${API}/admin/logs?agent_id=${agent._id}`, {headers})
    const d = await r.json()
    setAgentLogs(Array.isArray(d)?d:[])
  }

  const s = {
    wrap: {minHeight:'100dvh', background:'#fff8f0', fontFamily:"'Be Vietnam Pro',sans-serif",
      paddingTop:'env(safe-area-inset-top)', paddingBottom:'env(safe-area-inset-bottom)'},
    hdr: {background:`linear-gradient(135deg,${orange},#f57c00)`, color:'#fff',
      padding:'16px 18px', display:'flex', alignItems:'center', justifyContent:'space-between',
      boxShadow:'0 2px 12px rgba(230,81,0,.3)'},
    card: {background:'#fff', borderRadius:14, padding:16, margin:'0 12px 12px',
      boxShadow:'0 2px 8px rgba(230,81,0,.08)', border:'1px solid #ffe0b2'},
    inp: {width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #ffe0b2',
      fontSize:14, marginBottom:8, boxSizing:'border-box', outline:'none', background:'#fff8f0', fontFamily:'inherit'},
    btn: {width:'100%', padding:'13px', borderRadius:10, background:orange,
      color:'#fff', fontWeight:700, fontSize:14, border:'none', cursor:'pointer'},
    btn2: (active) => ({padding:'9px 14px', borderRadius:10, border:'none', cursor:'pointer',
      fontWeight:600, fontSize:13, background:active?orange:orange2, color:active?'#fff':orange}),
    tag: (active) => ({padding:'3px 8px', borderRadius:6, fontSize:11, fontWeight:700,
      background:active?'#e8f5e9':'#ffebee', color:active?'#2e7d32':'#c62828'}),
  }

  const tiles = [
    {id:'agents', icon:'🏪', label:'Đại lý', count:agents.length, color:'#e65100', bg:'#fff3e0'},
    {id:'users',  icon:'👥', label:'Người dùng', count:users.length, color:'#1565c0', bg:'#e3f2fd'},
    {id:'ads',    icon:'📢', label:'Quảng cáo', count:'', color:'#2e7d32', bg:'#e8f5e9'},
    {id:'traffic',icon:'📊', label:'Traffic', count:'', color:'#00695c', bg:'#e0f2f1'},
  ]

  if (!token) return (
    <div style={{...s.wrap, display:'flex', flexDirection:'column', justifyContent:'center', minHeight:'100vh'}}>
      <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800&display=swap" rel="stylesheet"/>
      <div style={{textAlign:'center', padding:'40px 20px 24px'}}>
        <div style={{width:72,height:72,borderRadius:20,background:`linear-gradient(135deg,${orange},#f57c00)`,
          margin:'0 auto 16px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,
          boxShadow:'0 6px 20px rgba(230,81,0,.3)'}}>🛡️</div>
        <div style={{fontWeight:800,fontSize:24,color:orange}}>NNS Admin</div>
        <div style={{fontSize:13,color:'#888',marginTop:6}}>Cổng quản trị hệ thống</div>
      </div>
      <div style={{background:'#fff',borderRadius:'24px 24px 0 0',padding:'28px 20px',flex:1}}>
        {error && <div style={{color:'#c62828',fontSize:13,marginBottom:10,padding:'8px 12px',background:'#ffebee',borderRadius:8}}>⚠ {error}</div>}
        <div style={{fontSize:12,color:'#888',marginBottom:4}}>Mật khẩu admin</div>
        <input style={s.inp} type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&doLogin()}/>
        <button style={s.btn} onClick={doLogin} disabled={loading}>{loading?<Spinner size={18} color='#fff' style={{margin:'0 auto'}}/>:'🔐 Đăng nhập'}</button>
      </div>
    </div>
  )

  return (
    <div style={s.wrap}>
      <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800&display=swap" rel="stylesheet"/>

      <div style={s.hdr}>
        <div>
          <div style={{fontWeight:800,fontSize:17}}>🛡️ NNS Admin</div>
          <div style={{fontSize:11,opacity:.8,marginTop:2}}>Quản trị hệ thống</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button onClick={()=>setShowNoti(true)} style={{position:'relative',background:'rgba(255,255,255,.2)',border:'1px solid rgba(255,255,255,.3)',
            color:'#fff',padding:'7px 13px',borderRadius:10,cursor:'pointer',fontSize:18}}>
            🔔
            {notifications.filter(n=>!n.read).length>0 && (
              <span style={{position:'absolute',top:-4,right:-4,background:'#c62828',color:'#fff',
                borderRadius:'50%',width:18,height:18,fontSize:11,fontWeight:700,
                display:'flex',alignItems:'center',justifyContent:'center'}}>
                {notifications.filter(n=>!n.read).length}
              </span>
            )}
          </button>
          <button onClick={logout} style={{background:'rgba(255,255,255,.2)',border:'1px solid rgba(255,255,255,.3)',
            color:'#fff',padding:'7px 13px',borderRadius:10,cursor:'pointer',fontSize:13,fontWeight:600}}>
            Đăng xuất
          </button>
        </div>
      </div>

      {saved && <div style={{margin:'12px',color:'#2e7d32',fontSize:13,padding:'8px 12px',background:'#e8f5e9',borderRadius:8,fontWeight:600}}>{saved}</div>}

      {/* NOTIFICATION MODAL */}
      {showNoti && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:1000,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
          <div style={{background:'#fff',borderRadius:'20px 20px 0 0',maxHeight:'80vh',overflow:'hidden',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'16px 18px',borderBottom:'1px solid #ffe0b2',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{fontWeight:800,fontSize:16,color:orange}}>🔔 Thông báo</div>
              <button onClick={()=>setShowNoti(false)} style={{background:'#f5f5f5',border:'none',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontWeight:700}}>✕</button>
            </div>
            <div style={{overflowY:'auto',padding:'12px'}}>
              {notifications.length===0 && <div style={{textAlign:'center',padding:40,color:'#888'}}>Chưa có thông báo nào</div>}
              {notifications.map(n=>(
                <div key={n._id} style={{background:n.read?'#f9f9f9':'#fff8f0',borderRadius:12,padding:'12px 14px',
                  marginBottom:8,border:`1.5px solid ${n.read?'#eee':'#ffcc80'}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:13,color:orange,marginBottom:4}}>
                        {n.type==='unlock_request'?'🔓 Yêu cầu mở khóa tài khoản':'📋 Thông báo'}
                      </div>
                      <div style={{fontSize:13,color:'#333',marginBottom:2}}>SĐT: <b>{n.phone}</b></div>
                      {n.reason && <div style={{fontSize:12,color:'#666',marginBottom:4}}>{n.reason}</div>}
                      <div style={{fontSize:11,color:'#aaa'}}>{toVN(n.at)}</div>
                    </div>
                    {!n.approved && n.type==='unlock_request' && (
                      <button onClick={async()=>{
                        await fetch(`${API}/admin/notifications/${n._id}/approve`,{method:'PUT',headers})
                        fetchAll()
                        setSaved('✅ Đã mở khóa tài khoản!')
                      }} style={{background:'#e8f5e9',border:'none',color:'#2e7d32',padding:'8px 12px',
                        borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:12,whiteSpace:'nowrap'}}>
                        ✅ Mở khóa
                      </button>
                    )}
                    {n.approved && <span style={{fontSize:11,color:'#2e7d32',fontWeight:700}}>✅ Đã mở</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {screen==='home' && (
        <div style={{padding:'12px'}}>
          {/* Stats */}
          <div style={{background:'rgba(230,81,0,.08)',borderRadius:16,padding:'16px 20px',marginBottom:12,border:'1px solid #ffe0b2'}}>
            <div style={{fontSize:11,color:orange,fontWeight:700,marginBottom:10,letterSpacing:.5}}>TỔNG QUAN HỆ THỐNG</div>
            <div style={{display:'flex',justifyContent:'space-around',textAlign:'center'}}>
              <div>
                <div style={{fontSize:28,fontWeight:800,color:orange,fontFamily:'monospace'}}>{agents.length}</div>
                <div style={{fontSize:11,color:'#888'}}>Đại lý</div>
              </div>
              <div style={{width:1,background:'#ffe0b2'}}/>
              <div>
                <div style={{fontSize:28,fontWeight:800,color:'#1565c0',fontFamily:'monospace'}}>{users.length}</div>
                <div style={{fontSize:11,color:'#888'}}>Người dùng</div>
              </div>
              <div style={{width:1,background:'#ffe0b2'}}/>
              <div>
                <div style={{fontSize:28,fontWeight:800,color:'#6a1b9a',fontFamily:'monospace'}}>{logs.length}</div>
                <div style={{fontSize:11,color:'#888'}}>Log</div>
              </div>
            </div>
          </div>

          {/* Tiles */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {tiles.map(t=>(
              <button key={t.id} onClick={()=>{setScreen(t.id);setSaved('')}}
                style={{background:t.bg,border:`2px solid ${t.color}22`,borderRadius:16,
                  padding:'20px 16px',cursor:'pointer',textAlign:'left',aspectRatio:'1/0.85'}}>
                <div style={{fontSize:28,marginBottom:8}}>{t.icon}</div>
                <div style={{fontWeight:700,fontSize:14,color:t.color}}>{t.label}</div>
                {t.count!=='' && <div style={{fontSize:20,fontWeight:800,color:t.color,fontFamily:'monospace',marginTop:4}}>{t.count}</div>}
              </button>
            ))}
          </div>
        </div>
      )}

      {screen!=='home' && (
        <div style={{background:'#fff8f0',minHeight:'calc(100vh - 60px)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 16px'}}>
            <button onClick={()=>{setScreen('home');setSaved('')}}
              style={{background:orange2,border:'none',color:orange,padding:'8px 14px',borderRadius:10,cursor:'pointer',fontWeight:700,fontSize:13}}>
              ← Quay lại
            </button>
            <span style={{fontWeight:700,fontSize:15,color:orange}}>
              {screen==='agent_detail'?'🏪':tiles.find(t=>t.id===screen)?.icon} {screen==='agent_detail'?selectedAgent?.name:tiles.find(t=>t.id===screen)?.label}
            </span>
            {screen==='agents' && (
              <button onClick={()=>setShowAddAgent(true)}
                style={{marginLeft:'auto',background:orange,border:'none',color:'#fff',padding:'8px 14px',borderRadius:10,cursor:'pointer',fontWeight:700,fontSize:13}}>
                + Thêm đại lý
              </button>
            )}
          </div>

          {/* AGENTS */}
          {screen==='agents' && (
            <div>
              {showAddAgent && (
                <div style={s.card}>
                  <div style={{fontWeight:700,marginBottom:12,color:orange}}>➕ Thêm đại lý mới</div>
                  {['name','address','phone','phone2','zalo','email','facebook','lat','lng'].map(k=>(
                    <div key={k}>
                      <div style={{fontSize:11,color:'#888',marginBottom:3}}>{k}</div>
                      <input style={s.inp} value={newAgent[k]} onChange={e=>setNewAgent({...newAgent,[k]:e.target.value})} placeholder={k}/>
                    </div>
                  ))}
                  <div style={{display:'flex',gap:8}}>
                    <button style={{...s.btn,flex:1}} onClick={addAgent} disabled={loading}>{loading?'...':'✅ Thêm'}</button>
                    <button style={{flex:1,padding:'13px',borderRadius:10,border:'1px solid #ddd',background:'#f5f5f5',fontWeight:600,cursor:'pointer'}} onClick={()=>setShowAddAgent(false)}>Hủy</button>
                  </div>
                </div>
              )}
              {agents.map(a=>(
                <div key={a._id} style={{...s.card,padding:'12px 14px',cursor:'pointer'}} onClick={()=>openAgent(a)}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:14}}>{a.name}</div>
                      <div style={{fontSize:12,color:'#888',marginTop:2}}>{a.address} · {a.phone}</div>
                      <div style={{fontSize:12,color:orange,marginTop:2,fontFamily:'monospace'}}>Giá: {a.price>0?fmt(a.price)+'đ':'chưa cập nhật'}</div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={s.tag(a.active)}>{a.active?'Hoạt động':'Đã khóa'}</span>
                      <span style={{color:'#ccc',fontSize:18}}>›</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* USERS */}
          {screen==='users' && (
            <div>
              {users.map(u=>(
                <div key={u._id} style={{...s.card,padding:'12px 14px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:14}}>{u.ho_ten||'—'}</div>
                      <div style={{fontSize:12,color:'#888',marginTop:2}}>{u.so_dien_thoai}</div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
                      <span style={s.tag(u.active!==false)}>{u.active!==false?'Hoạt động':'Đã khóa'}</span>
                      <button onClick={()=>lockUser(u._id,u.ho_ten)}
                        style={{padding:'5px 10px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,
                          background:u.active!==false?'#ffebee':'#e8f5e9',color:u.active!==false?'#c62828':'#2e7d32'}}>
                        {u.active!==false?'🔒 Khóa':'🔓 Mở'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AGENT DETAIL */}
          {screen==='agent_detail' && selectedAgent && (
            <div>
              <div style={s.card}>
                <div style={{fontWeight:700,fontSize:16,marginBottom:12,color:orange}}>{selectedAgent.name}</div>
                {[['Địa chỉ',selectedAgent.address],['SĐT',selectedAgent.phone],
                  ['SĐT 2',selectedAgent.phone2],['Zalo',selectedAgent.zalo],
                  ['Email',selectedAgent.email],['Tọa độ',`${selectedAgent.lat}, ${selectedAgent.lng}`],
                  ['Lượt xem',selectedAgent.views],['Giá',selectedAgent.price>0?fmt(selectedAgent.price)+'đ':'Chưa cập nhật']
                ].map(([k,v])=>v?(
                  <div key={k} style={{display:'flex',gap:10,marginBottom:6,fontSize:13}}>
                    <span style={{color:'#888',width:70,flexShrink:0}}>{k}</span>
                    <span style={{fontWeight:500}}>{v}</span>
                  </div>
                ):null)}
                <div style={{marginTop:12,display:'flex',gap:8}}>
                  <button onClick={()=>lockAgent(selectedAgent._id,selectedAgent.name).then(()=>openAgent({...selectedAgent,active:!selectedAgent.active}))}
                    style={{flex:1,padding:'11px',borderRadius:10,border:'none',cursor:'pointer',fontWeight:700,fontSize:13,
                      background:selectedAgent.active?'#ffebee':'#e8f5e9',color:selectedAgent.active?'#c62828':'#2e7d32'}}>
                    {selectedAgent.active?'🔒 Khóa tài khoản':'🔓 Mở khóa'}
                  </button>
                </div>
                <div style={{borderTop:'1px solid #ffe0b2',marginTop:16,paddingTop:16}}>
                  <div style={{fontWeight:700,fontSize:14,color:orange,marginBottom:10}}>💰 Cập nhật giá thu mua</div>
                  <div style={{background:'#fff3e0',borderRadius:10,padding:'8px 12px',marginBottom:10,fontSize:13,color:orange}}>
                    Giá hiện tại: <b>{selectedAgent.price>0?fmt(selectedAgent.price)+'đ':'Chưa có'}</b>
                  </div>
                  <input style={s.inp} type="number" inputMode="numeric" placeholder="Giá mới (đ/kg)"
                    value={adminPrice} onChange={e=>setAdminPrice(e.target.value)}/>
                  <input style={s.inp} placeholder="Ghi chú (không bắt buộc)"
                    value={adminPriceNote} onChange={e=>setAdminPriceNote(e.target.value)}/>
                  <button style={s.btn} onClick={updateAgentPrice} disabled={!adminPrice||loading}>
                    {loading?'Đang lưu...':'💾 Cập nhật giá'}
                  </button>
                </div>
              </div>
              <div style={{padding:'0 12px',fontWeight:700,fontSize:14,color:orange,marginBottom:8}}>
                📋 Nhật ký hoạt động ({agentLogs.length})
              </div>
              {agentLogs.length===0 && <div style={{textAlign:'center',padding:20,color:'#888',fontSize:13}}>Chưa có log nào</div>}
              {agentLogs.map((l,i)=>(
                <div key={i} style={{...s.card,padding:'12px 14px',margin:'0 12px 8px',borderLeft:`3px solid ${
                  l.action==='update_price'?'#1565c0':l.action==='add_product'?'#2e7d32':l.action==='delete_product'?'#c62828':'#888'
                }`}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                    <span style={{fontSize:15}}>
                      {l.action==='update_price'?'💰':l.action==='add_product'?'➕':l.action==='delete_product'?'🗑':'📋'}
                    </span>
                    <span style={{fontWeight:700,fontSize:13,color:
                      l.action==='update_price'?'#1565c0':l.action==='add_product'?'#2e7d32':l.action==='delete_product'?'#c62828':'#555'
                    }}>
                      {l.action==='update_price'?'Cập nhật giá':l.action==='add_product'?'Thêm sản phẩm':l.action==='delete_product'?'Xóa sản phẩm':l.action||'—'}
                    </span>
                  </div>
                  <div style={{fontSize:13,color:'#333',marginBottom:4,fontFamily:'monospace'}}>{l.detail||'—'}</div>
                  <div style={{fontSize:11,color:'#aaa'}}>{toVN(l.at)}</div>
                </div>
              ))}
            </div>
          )}

          {/* ADS */}
          {screen==='ads' && (
            <div style={s.card}>
              <div style={{fontWeight:700,marginBottom:12,color:orange}}>📢 Banner trang chủ</div>
              <div style={{fontSize:12,color:'#888',marginBottom:4}}>Tiêu đề banner</div>
              <input style={s.inp} value={ads.banner_title||''} onChange={e=>setAds({...ads,banner_title:e.target.value})} placeholder="Tiêu đề"/>
              <div style={{fontSize:12,color:'#888',marginBottom:4}}>Nội dung banner</div>
              <input style={s.inp} value={ads.banner_body||''} onChange={e=>setAds({...ads,banner_body:e.target.value})} placeholder="Nội dung"/>
              <div style={{fontWeight:700,margin:'16px 0 12px',color:orange}}>🪟 Popup khi mở web</div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                <span style={{fontSize:13}}>Bật popup</span>
                <input type="checkbox" checked={ads.popup_enabled||false} onChange={e=>setAds({...ads,popup_enabled:e.target.checked})} style={{width:18,height:18}}/>
              </div>
              <div style={{fontSize:12,color:'#888',marginBottom:4}}>Tiêu đề popup</div>
              <input style={s.inp} value={ads.popup_title||''} onChange={e=>setAds({...ads,popup_title:e.target.value})} placeholder="Tiêu đề popup"/>
              <div style={{fontSize:12,color:'#888',marginBottom:4}}>Nội dung popup</div>
              <input style={s.inp} value={ads.popup_body||''} onChange={e=>setAds({...ads,popup_body:e.target.value})} placeholder="Nội dung popup"/>
              <button style={s.btn} onClick={saveAds} disabled={loading}>{loading?'Đang lưu...':'💾 Lưu quảng cáo'}</button>
            </div>
          )}

          {/* TRAFFIC */}
          {screen==='traffic' && (
            <div style={s.card}>
              <div style={{fontWeight:700,marginBottom:16,color:orange}}>📊 Traffic 48 giờ gần nhất</div>
              {traffic.length===0 && <div style={{textAlign:'center',padding:20,color:'#888',fontSize:13}}>Chưa có dữ liệu</div>}
              {traffic.map((t,i)=>{
                const max = Math.max(...traffic.map(x=>x.count),1)
                const pct = Math.round(t.count/max*100)
                return (
                  <div key={i} style={{marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:3}}>
                      <span style={{color:'#888'}}>{t._id}</span>
                      <span style={{fontWeight:700,color:orange}}>{t.count} lượt</span>
                    </div>
                    <div style={{background:'#ffe0b2',borderRadius:4,height:8}}>
                      <div style={{background:orange,borderRadius:4,height:8,width:`${pct}%`,transition:'width .3s'}}/>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
