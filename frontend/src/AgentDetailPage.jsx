const toVN = s => s ? new Date((s+'').endsWith('Z')||(s+'').includes('+') ? s : s+'Z').toLocaleString('vi-VN') : '';
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useParams, useNavigate } from 'react-router-dom'

const API = 'https://api.nns.id.vn'
const fmt = n => n?.toLocaleString('vi-VN') ?? '—'

function ChangeTag({ val }) {
  if (val === 0) return <span style={{fontSize:12,padding:'2px 8px',borderRadius:6,fontWeight:700,background:'#fff3e0',color:'#e65100',fontFamily:'monospace'}}>─ 0</span>
  const up = val > 0
  return (
    <span style={{fontSize:12,padding:'2px 8px',borderRadius:6,fontWeight:700,fontFamily:'monospace',
      background: up ? '#e8f5e9' : '#ffebee',
      color: up ? '#2e7d32' : '#c62828'}}>
      {up ? '▲ +' : '▼ '}{fmt(Math.abs(val))}đ
    </span>
  )
}

export default function AgentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('info')
  const [following, setFollowing] = useState(false)
  const [followers, setFollowers] = useState(0)
  const [followLoading, setFollowLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    if (!id) { setError('Không tìm thấy đại lý'); setLoading(false); return }
    fetch(`${API}/agents/${id}`)
      .then(r => { if (!r.ok) throw new Error('Không tìm thấy'); return r.json() })
      .then(d => {
        setAgent(d)
        setFollowers(d.followers?.length || 0)
        setLoading(false)
        // fetch follow status nếu đã đăng nhập
        const token = localStorage.getItem('agribot_token')
        if (token) {
          fetch(`${API}/agents/${id}/follow-status`, {headers:{Authorization:`Bearer ${token}`}})
            .then(r => r.json())
            .then(s => { setFollowing(s.following); setFollowers(s.followers) })
            .catch(() => {})
        }
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [id])

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --bg:#f2f7f2;--bg2:#e8f2e8;--surf:#fff;
      --bdr:#c8dfc8;--bdr2:#b0cfb0;
      --txt:#1a2e1a;--txt2:#4a6e4a;--txt3:#8aaa8a;
      --green:#2e7d32;--green2:#43a047;--green3:#e8f5e9;
      --red:#c62828;--red2:#ffebee;
      --yellow:#e65100;
      --blue:#1565c0;--blue2:#e3f2fd;
      --r:14px;--rs:10px;
    }
    html,body{background:var(--bg);color:var(--txt);font-family:'Be Vietnam Pro',sans-serif;min-height:100dvh;}
    .grid-shop{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
    .product-card{background:var(--surf);border:1px solid var(--bdr);border-radius:var(--rs);overflow:hidden;display:flex;flex-direction:column;box-shadow:0 2px 8px rgba(0,0,0,.04);cursor:pointer;transition:transform .15s;-webkit-tap-highlight-color:transparent;}
    .product-card:active{transform:scale(.96);}
    .product-img-wrap{width:100%;aspect-ratio:1/1;background:var(--bg2);display:flex;align-items:center;justify-content:center;overflow:hidden;}
    .product-img{width:100%;height:100%;object-fit:cover;}
    .product-img-ph{font-size:32px;opacity:.3;}
    .product-info{padding:10px;flex:1;display:flex;flex-direction:column;gap:4px;}
    .product-name{font-size:13px;font-weight:600;color:var(--txt);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:36px;}
    .product-cat{font-size:11px;color:var(--txt3);}
    .product-bottom{display:flex;align-items:baseline;gap:2px;margin-top:auto;}
    .product-price{font-size:15px;font-weight:800;color:var(--yellow);}
    .product-unit{font-size:10px;color:var(--txt3);}
    @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  `

  const doFollow = async () => {
    const token = localStorage.getItem('agribot_token')
    if (!token) { alert('Vui lòng đăng nhập để theo dõi đại lý!'); return }
    setFollowLoading(true)
    try {
      const r = await fetch(`${API}/agents/${id}/follow`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      })
      const d = await r.json()
      setFollowing(d.following)
      setFollowers(d.followers)
    } catch {}
    setFollowLoading(false)
  }

  if (loading) return (
    <>
      <style>{css}</style>
      <div style={{minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,background:'var(--bg)'}}>
        <div style={{fontSize:32}}>⏳</div>
        <div style={{fontSize:14,color:'#888'}}>Đang tải thông tin đại lý...</div>
      </div>
    </>
  )

  if (error || !agent) return (
    <>
      <style>{css}</style>
      <div style={{minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,padding:24,background:'var(--bg)'}}>
        <div style={{fontSize:48}}>😕</div>
        <div style={{fontWeight:700,fontSize:16}}>Không tìm thấy đại lý</div>
        <div style={{fontSize:13,color:'#888'}}>{error}</div>
        <button onClick={() => navigate('/')}
          style={{padding:'12px 28px',borderRadius:12,background:'var(--green)',color:'#fff',fontWeight:700,fontSize:14,border:'none',cursor:'pointer'}}>
          ← Về trang chủ
        </button>
      </div>
    </>
  )

  const latestPrice = agent.price_history?.length > 0
    ? agent.price_history[agent.price_history.length - 1]
    : null

  const TABS = [
    { id: 'info',     label: 'Thông tin',   icon: '📋' },
    { id: 'products', label: 'Sản phẩm',    icon: '🛒' },
    { id: 'history',  label: 'Lịch sử giá', icon: '📈' },
  ]

  return (
    <>
      <style>{css}</style>
      <div style={{maxWidth:480,margin:'0 auto',minHeight:'100dvh',background:'var(--bg)'}}>

        <div style={{background:'linear-gradient(135deg,#1b5e20,#2e7d32)',paddingTop:'calc(env(safe-area-inset-top) + 12px)',paddingBottom:0}}>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'0 16px 16px'}}>
            <button onClick={() => navigate(-1)}
              style={{background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.25)',color:'#fff',
                width:36,height:36,borderRadius:10,cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              ←
            </button>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,color:'rgba(255,255,255,.6)',marginBottom:2}}>Thông tin đại lý</div>
              <div style={{fontWeight:800,fontSize:16,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{agent.name}</div>
            </div>

            {agent.active === false && (
              <span style={{background:'#ffebee',color:'#c62828',fontSize:11,fontWeight:700,padding:'4px 8px',borderRadius:8}}>Tạm dừng</span>
            )}
          </div>

          <div style={{margin:'0 12px',background:'rgba(255,255,255,.1)',borderRadius:'16px 16px 0 0',padding:'20px 22px',border:'1px solid rgba(255,255,255,.15)',borderBottom:'none'}}>
            <div style={{fontSize:11,color:'rgba(255,255,255,.6)',marginBottom:6,fontWeight:600,letterSpacing:.5}}>GIÁ MUA CÀ PHÊ NHÂN XÔ</div>
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
              <div>
                <div style={{fontSize:34,fontWeight:800,color:'#fff',fontFamily:'JetBrains Mono,monospace',letterSpacing:'-1px',lineHeight:1}}>
                  {agent.price > 0 ? fmt(agent.price) : '—'}
                  {agent.price > 0 && <span style={{fontSize:14,fontWeight:400,color:'rgba(255,255,255,.6)',marginLeft:4}}>đ/kg</span>}
                </div>
                {agent.change !== undefined && agent.price > 0 && (
                  <div style={{marginTop:6}}><ChangeTag val={agent.change} /></div>
                )}
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:11,color:'rgba(255,255,255,.5)'}}>Lượt xem</div>
                <div style={{fontSize:22,fontWeight:700,color:'rgba(255,255,255,.85)',fontFamily:'monospace'}}>{agent.views || 0}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:11,color:'rgba(255,255,255,.5)'}}>Theo dõi</div>
                <div style={{fontSize:22,fontWeight:700,color: following ? '#ffd54f' : 'rgba(255,255,255,.85)',fontFamily:'monospace'}}>{followers}</div>
              </div>
            </div>
            {latestPrice && (
              <div style={{marginTop:10,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                <div style={{fontSize:11,color:"rgba(255,255,255,.45)"}}>
                  Cập nhật: {toVN(latestPrice.at)}
                  {latestPrice.note ? ` · ${latestPrice.note}` : ""}
                </div>
                <button onClick={doFollow} disabled={followLoading}
                  style={{padding:"6px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,
                    background: following ? "rgba(255,255,255,.2)" : "rgba(255,255,255,.9)",
                    color: following ? "#fff" : "var(--green)",
                    opacity: followLoading ? .6 : 1, transition:"all .2s", whiteSpace:"nowrap", flexShrink:0}}>
                  {followLoading ? "..." : following ? "✅ Theo dõi" : "+ Theo dõi"}
                </button>
              </div>
            )}
          </div>
        </div>
        <div style={{margin:'0 12px',background:'#fff',borderRadius:'0 0 0 0',borderBottom:'1.5px solid var(--bdr)',display:'flex',border:'1px solid var(--bdr)',borderTop:'none'}}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{flex:1,padding:'12px 4px',border:'none',cursor:'pointer',fontFamily:'inherit',
                fontSize:12,fontWeight:700,display:'flex',flexDirection:'column',alignItems:'center',gap:3,
                background: tab === t.id ? 'var(--green3)' : '#fff',
                color: tab === t.id ? 'var(--green)' : 'var(--txt3)',
                borderBottom: tab === t.id ? '2.5px solid var(--green)' : '2.5px solid transparent',
                transition:'all .15s'}}>
              <span style={{fontSize:16}}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{padding:'12px 12px 80px'}}>
          {tab === 'info' && (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {agent.price_history && agent.price_history.length > 0 && (
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  <div style={{background:'#fff',borderRadius:14,border:'1.5px solid var(--bdr)',padding:'12px 8px 8px'}}>
                    <div style={{fontSize:11,color:'var(--txt3)',marginBottom:6,paddingLeft:8}}>Biến động giá 30 lần gần nhất</div>
                    <ResponsiveContainer width="100%" height={130}>
                      <LineChart data={[...agent.price_history].map(h => ({
                        price: h.price,
                        time: new Date((h.at+'').endsWith('Z')||(h.at+'').includes('+') ? h.at : h.at+'Z').toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'})
                      }))}>
                        <XAxis dataKey="time" tick={{fontSize:9}} interval="preserveStartEnd" tickLine={false} axisLine={false}/>
                        <YAxis domain={['auto','auto']} tick={{fontSize:9}} tickFormatter={v=>v/1000+'k'} tickLine={false} axisLine={false} width={32}/>
                        <Tooltip formatter={(v)=>[`${v.toLocaleString('vi-VN')}đ/kg`,'Giá']} labelStyle={{fontSize:11}} contentStyle={{fontSize:11,borderRadius:8,border:'1px solid var(--bdr)'}}/>
                        <ReferenceLine y={agent.price} stroke="#2e7d32" strokeDasharray="3 3" strokeWidth={1}/>
                        <Line type="monotone" dataKey="price" stroke="#2e7d32" strokeWidth={2} dot={false} activeDot={{r:4}}/>
                      </LineChart>
                    </ResponsiveContainer>
                    <div style={{borderTop:'1px solid var(--bdr)',marginTop:4,paddingTop:6,paddingLeft:4,paddingRight:4}}>
                      {[...agent.price_history].reverse().slice(0,3).map((h,i) => {
                        const idx = agent.price_history.length - 1 - i
                        const prev = agent.price_history[idx-1]
                        const change = prev ? h.price - prev.price : 0
                        return (
                          <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0',
                            borderBottom:i<2?'1px solid var(--bdr)':'none'}}>
                            <span style={{fontSize:11,fontWeight:700,fontFamily:'JetBrains Mono,monospace',
                              color:i===0?'var(--green)':'var(--txt)',whiteSpace:'nowrap'}}>
                              {fmt(h.price)}đ
                            </span>
                            {change!==0 && <ChangeTag val={change}/>}
                            <span style={{fontSize:10,color:'var(--txt3)',marginLeft:'auto',whiteSpace:'nowrap',fontFamily:'monospace'}}>
                              {toVN(h.at)}
                            </span>
                          </div>
                        )
                      })}
                      {agent.price_history.length > 3 && (
                        <button onClick={()=>setTab('history')} style={{width:'100%',padding:'5px 0',border:'none',background:'none',color:'var(--green)',fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit',textAlign:'left'}}>
                          Xem thêm {agent.price_history.length-3} lần →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div style={{background:'#fff',borderRadius:14,border:'1.5px solid var(--bdr)',overflow:'hidden'}}>
                {[
                  { icon:'📍', label:'Địa chỉ',   val: agent.address },
                  { icon:'📞', label:'SĐT chính', val: agent.phone,    href:`tel:${agent.phone}` },
                  { icon:'📱', label:'SĐT phụ',   val: agent.phone2,   href:`tel:${agent.phone2}` },
                  { icon:'💬', label:'Zalo',       val: agent.zalo,     href:`https://zalo.me/${agent.zalo}` },
                  { icon:'📧', label:'Email',      val: agent.email,    href:`mailto:${agent.email}` },
                  { icon:'👥', label:'Facebook',   val: agent.facebook, href: agent.facebook },
                ].filter(row => row.val).map((row, i, arr) => (
                  <div key={row.label} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 16px',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--bdr)' : 'none'}}>
                    <span style={{fontSize:18,flexShrink:0}}>{row.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:10,color:'var(--txt3)',fontWeight:600,textTransform:'uppercase',letterSpacing:.5}}>{row.label}</div>
                      {row.href ? (
                        <a href={row.href} style={{fontSize:14,fontWeight:600,color:'var(--blue)',textDecoration:'none',display:'block',marginTop:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                          {row.val}
                        </a>
                      ) : (
                        <div style={{fontSize:14,fontWeight:600,color:'var(--txt)',marginTop:1}}>{row.val}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {agent.phone && (
                <div style={{display:"flex",gap:8}}>
                  <a href={`tel:${agent.phone}`}
                    style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,
                      padding:"10px 6px",borderRadius:10,background:"var(--green)",color:"#fff",
                      fontWeight:700,fontSize:12,textDecoration:"none"}}>
                    📞 Gọi ngay
                  </a>
                  <a href={`https://zalo.me/${agent.zalo || agent.phone}`}
                    style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,
                      padding:"10px 6px",borderRadius:10,background:"var(--blue2)",color:"var(--blue)",
                      fontWeight:700,fontSize:12,textDecoration:"none",border:"1.5px solid #90caf9"}}>
                    💬 Zalo
                  </a>
                  {agent.lat && agent.lng && (
                    <a href={`https://www.google.com/maps/search/?api=1&query=${agent.lat},${agent.lng}`}
                      target="_blank" rel="noreferrer"
                      style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,
                        padding:"10px 6px",borderRadius:10,background:"#fff",color:"var(--txt)",
                        fontWeight:700,fontSize:12,textDecoration:"none",border:"1.5px solid var(--bdr)"}}>
                      🗺 Bản đồ
                    </a>
                  )}
                </div>
              )}
              {agent.price_table && agent.price_table.length > 0 && (
                <div style={{background:'#fff',borderRadius:14,border:'1.5px solid var(--bdr)',overflow:'hidden'}}>
                  <div style={{padding:'12px 16px 8px',borderBottom:'1px solid var(--bdr)'}}>
                    <div style={{fontWeight:700,fontSize:13,color:'var(--green)'}}>📋 Bảng giá</div>
                  </div>
                  {agent.price_table.map((item, i) => (
                    <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                      padding:'10px 16px',borderBottom:i<agent.price_table.length-1?'1px solid var(--bdr)':'none'}}>
                      <div style={{fontSize:13,fontWeight:600,color:'var(--txt)'}}>{item.name}</div>
                      <div style={{fontSize:14,fontWeight:800,fontFamily:'JetBrains Mono,monospace',color:'var(--green)'}}>
                        {item.price > 0 ? fmt(item.price)+'đ/kg' : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {tab === 'products' && (
            <div>
              {(!agent.products || agent.products.length === 0) ? (
                <div style={{textAlign:'center',padding:'48px 20px',color:'var(--txt3)'}}>
                  <div style={{fontSize:40,marginBottom:12}}>📦</div>
                  <div style={{fontWeight:600,fontSize:15,color:'var(--txt2)',marginBottom:6}}>Chưa có sản phẩm</div>
                  <div style={{fontSize:13}}>Đại lý chưa đăng sản phẩm nào</div>
                </div>
              ) : (
                <div className="grid-shop">
                  {agent.products.map((p, i) => (
                    <div key={p.id || i} className="product-card" onClick={() => setSelectedProduct(p)}>
                      <div className="product-img-wrap">
                        {p.image_url
                          ? <img src={p.image_url} alt={p.name} className="product-img"/>
                          : <div className="product-img-ph">📦</div>
                        }
                      </div>
                      <div className="product-info">
                        <div className="product-name">{p.name}</div>
                        <div className="product-cat">{p.category}</div>
                        <div className="product-bottom">
                          <div className="product-price">{fmt(p.price)}đ</div>
                          <div className="product-unit">/{p.unit}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {agent.price_history && agent.price_history.length > 0 && (
                <div style={{background:'#fff',borderRadius:14,border:'1.5px solid var(--bdr)',padding:'12px 8px 4px'}}>
                  <div style={{fontSize:11,color:'var(--txt3)',marginBottom:6,paddingLeft:8}}>Biến động giá 30 lần gần nhất</div>
                  <ResponsiveContainer width="100%" height={130}>
                    <LineChart data={[...agent.price_history].map(h => ({
                      price: h.price,
                      time: new Date((h.at+'').endsWith('Z')||(h.at+'').includes('+') ? h.at : h.at+'Z').toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'})
                    }))}>
                      <XAxis dataKey="time" tick={{fontSize:9}} interval="preserveStartEnd" tickLine={false} axisLine={false}/>
                      <YAxis domain={['auto','auto']} tick={{fontSize:9}} tickFormatter={v=>v/1000+'k'} tickLine={false} axisLine={false} width={32}/>
                      <Tooltip formatter={(v)=>[`${v.toLocaleString('vi-VN')}đ/kg`,'Giá']} labelStyle={{fontSize:11}} contentStyle={{fontSize:11,borderRadius:8,border:'1px solid var(--bdr)'}}/>
                      <ReferenceLine y={agent.price} stroke="#2e7d32" strokeDasharray="3 3" strokeWidth={1}/>
                      <Line type="monotone" dataKey="price" stroke="#2e7d32" strokeWidth={2} dot={false} activeDot={{r:4}}/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              {(!agent.price_history || agent.price_history.length === 0) ? (
                <div style={{textAlign:'center',padding:'48px 20px',color:'var(--txt3)'}}>
                  <div style={{fontSize:40,marginBottom:12}}>📈</div>
                  <div style={{fontWeight:600,fontSize:15,color:'var(--txt2)',marginBottom:6}}>Chưa có lịch sử</div>
                  <div style={{fontSize:13}}>Đại lý chưa cập nhật giá lần nào</div>
                </div>
              ) : (
                <>
                <div style={{background:'#fff',borderRadius:14,border:'1.5px solid var(--bdr)',overflow:'hidden'}}>
                  {[...agent.price_history].reverse().map((h, i) => {
                    const prev = agent.price_history[agent.price_history.length - 2 - i]
                    const change = prev ? h.price - prev.price : 0
                    return (
                      <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',
                        borderBottom: i < agent.price_history.length - 1 ? '1px solid var(--bdr)' : 'none',
                        background: i === 0 ? 'var(--green3)' : '#fff'}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:14,fontWeight:700,fontFamily:'JetBrains Mono,monospace',color: i===0?'var(--green)':'var(--txt)'}}>
                            {fmt(h.price)}đ/kg
                            {i === 0 && <span style={{fontSize:10,fontWeight:600,marginLeft:6,color:'var(--green2)',fontFamily:'inherit'}}>MỚI NHẤT</span>}
                          </div>
                          {h.note && <div style={{fontSize:11,color:'var(--txt3)',marginTop:2}}>{h.note}</div>}
                        </div>
                        <div style={{textAlign:'right',flexShrink:0}}>
                          {i > 0 && change !== 0 && <div style={{marginBottom:3}}><ChangeTag val={change}/></div>}
                          <div style={{fontSize:10,color:'var(--txt3)',fontFamily:'monospace'}}>
                            {toVN(h.at)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedProduct && (
        <>
          <div onClick={() => setSelectedProduct(null)}
            style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:1000,animation:'fadeIn .2s ease'}}/>
          <div style={{
            position:'fixed',bottom:0,left:0,right:0,zIndex:1001,
            background:'var(--surf)',borderRadius:'20px 20px 0 0',
            maxHeight:'92dvh',overflowY:'auto',
            animation:'slideUp .3s cubic-bezier(.22,1,.36,1)',
            paddingBottom:'calc(24px + env(safe-area-inset-bottom))'
          }}>
            {/* Handle */}
            <div style={{display:'flex',justifyContent:'center',padding:'12px 0 4px',position:'sticky',top:0,background:'var(--surf)',zIndex:1}}>
              <div style={{width:40,height:4,background:'var(--bdr)',borderRadius:2}}/>
            </div>
            <button onClick={() => setSelectedProduct(null)} style={{
              position:'absolute',top:10,right:14,width:32,height:32,borderRadius:'50%',
              background:'var(--bg2)',border:'none',cursor:'pointer',fontSize:15,
              display:'flex',alignItems:'center',justifyContent:'center',color:'var(--txt2)',zIndex:2
            }}>✕</button>

            {/* Image */}
            <div style={{width:'100%',aspectRatio:'1/1',background:'var(--bg2)',overflow:'hidden',maxHeight:340,display:'flex',alignItems:'center',justifyContent:'center'}}>
              {selectedProduct.image_url
                ? <img src={selectedProduct.image_url} alt={selectedProduct.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                : <div style={{fontSize:72,opacity:.2}}>📦</div>
              }
            </div>

            <div style={{padding:'16px 16px 8px'}}>
              {/* Price */}
              <div style={{fontSize:28,fontWeight:800,color:'var(--yellow)',fontFamily:"'JetBrains Mono',monospace",lineHeight:1,marginBottom:8}}>
                {selectedProduct.price.toLocaleString('vi-VN')}đ
                <span style={{fontSize:13,fontWeight:400,color:'var(--txt3)',marginLeft:5}}>/{selectedProduct.unit}</span>
              </div>

              {/* Name */}
              <div style={{fontSize:17,fontWeight:700,color:'var(--txt)',lineHeight:1.45,marginBottom:10}}>
                {selectedProduct.name}
              </div>

              {/* Category */}
              {selectedProduct.category && (
                <span style={{
                  display:'inline-block',padding:'3px 12px',marginBottom:14,
                  background:'var(--green3)',color:'var(--green)',
                  borderRadius:20,fontSize:12,fontWeight:600,border:'1px solid var(--bdr)'
                }}>
                  {selectedProduct.category}
                </span>
              )}

              {/* Description */}
              {selectedProduct.description ? (
                <div style={{
                  fontSize:14,color:'var(--txt2)',lineHeight:1.75,
                  background:'var(--bg2)',borderRadius:10,padding:'12px 14px',marginBottom:16,
                  borderLeft:'3px solid var(--green3)'
                }}>
                  {selectedProduct.description}
                </div>
              ) : (
                <div style={{fontSize:13,color:'var(--txt3)',fontStyle:'italic',marginBottom:16}}>Chưa có mô tả sản phẩm.</div>
              )}

              <div style={{height:1,background:'var(--bdr)',margin:'4px 0 14px'}}/>

              {/* Seller */}
              <div style={{fontSize:11,color:'var(--txt3)',fontWeight:600,letterSpacing:.5,textTransform:'uppercase',marginBottom:8}}>Người bán</div>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                <div style={{
                  width:48,height:48,flexShrink:0,borderRadius:'50%',
                  background:'var(--green3)',border:'2px solid var(--bdr)',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:22
                }}>🏪</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:15,fontWeight:700,color:'var(--txt)'}}>{agent.name}</div>
                  {agent.address && (
                    <div style={{fontSize:12,color:'var(--txt3)',marginTop:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      📍 {agent.address}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action bar */}
            <div style={{
              position:'sticky',bottom:0,padding:'12px 16px 16px',
              background:'var(--surf)',borderTop:'1px solid var(--bdr)',
              display:'flex',gap:10
            }}>
              {(agent.zalo || agent.phone) && (
                <a href={`https://zalo.me/${(agent.zalo || agent.phone).replace(/^0/,'84')}`}
                  target="_blank" rel="noreferrer"
                  style={{
                    flex:1,padding:'14px',background:'#0068ff',color:'#fff',
                    borderRadius:12,fontSize:14,fontWeight:700,
                    textAlign:'center',textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:6
                  }}>💬 Zalo</a>
              )}
              {agent.phone && (
                <a href={`tel:${agent.phone}`}
                  style={{
                    flex:1,padding:'14px',background:'var(--green)',color:'#fff',
                    borderRadius:12,fontSize:14,fontWeight:700,
                    textAlign:'center',textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:6
                  }}>📞 Gọi ngay</a>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
