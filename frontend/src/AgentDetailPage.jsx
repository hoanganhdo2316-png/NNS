const toVN = s => s ? new Date((s+'').endsWith('Z')||(s+'').includes('+') ? s : s+'Z').toLocaleString('vi-VN') : '';
import { useState, useEffect } from 'react'
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
      --blue:#1565c0;--blue2:#e3f2fd;
      --r:14px;--rs:10px;
    }
    html,body{background:var(--bg);color:var(--txt);font-family:'Be Vietnam Pro',sans-serif;min-height:100dvh;}
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
            <button onClick={doFollow} disabled={followLoading}
              style={{background: following ? 'rgba(255,255,255,.15)' : '#fff',
                border: following ? '1px solid rgba(255,255,255,.4)' : 'none',
                color: following ? '#fff' : '#2e7d32',
                padding:'7px 13px',borderRadius:10,cursor:'pointer',
                fontWeight:700,fontSize:12,flexShrink:0,
                opacity: followLoading ? .6 : 1}}>
              {followLoading ? '...' : following ? '✓ Đang theo dõi' : '+ Theo dõi'}
            </button>
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
                <div style={{fontSize:11,color:'rgba(255,255,255,.5)'}}>Theo dõi</div>
                <div style={{fontSize:22,fontWeight:700,color: following ? '#ffd54f' : 'rgba(255,255,255,.85)',fontFamily:'monospace'}}>{followers}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:11,color:'rgba(255,255,255,.5)'}}>Lượt xem</div>
                <div style={{fontSize:22,fontWeight:700,color:'rgba(255,255,255,.85)',fontFamily:'monospace'}}>{agent.views || 0}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:11,color:'rgba(255,255,255,.5)'}}>Theo dõi</div>
                <div style={{fontSize:22,fontWeight:700,color:'rgba(255,255,255,.85)',fontFamily:'monospace'}}>{followers}</div>
              </div>
            </div>
            {latestPrice && (
              <div style={{marginTop:10,fontSize:11,color:'rgba(255,255,255,.45)'}}>
                Cập nhật: {toVN(latestPrice.at)}
                {latestPrice.note ? ` · ${latestPrice.note}` : ''}
              </div>
            )}
          </div>
        </div>

        <div style={{margin:'0 12px',background:'#fff',border:'1px solid var(--bdr)',borderTop:'none',padding:'10px 12px',display:'flex',justifyContent:'flex-end'}}>
          <button onClick={doFollow} disabled={followLoading}
            style={{padding:'9px 20px',borderRadius:10,border:'none',cursor:'pointer',fontWeight:700,fontSize:13,
              background: following ? '#e8f5e9' : 'var(--green)',
              color: following ? 'var(--green)' : '#fff',
              opacity: followLoading ? .6 : 1, transition:'all .2s'}}>
            {followLoading ? '...' : following ? '✅ Đang theo dõi' : '+ Theo dõi'}
          </button>
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
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <a href={`tel:${agent.phone}`}
                    style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                      padding:'14px 8px',borderRadius:12,background:'var(--green)',color:'#fff',
                      fontWeight:700,fontSize:14,textDecoration:'none',boxShadow:'0 3px 10px rgba(46,125,50,.3)'}}>
                    📞 Gọi ngay
                  </a>
                  <a href={`https://zalo.me/${agent.zalo || agent.phone}`}
                    style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                      padding:'14px 8px',borderRadius:12,background:'var(--blue2)',color:'var(--blue)',
                      fontWeight:700,fontSize:14,textDecoration:'none',border:'1.5px solid #90caf9'}}>
                    💬 Nhắn Zalo
                  </a>
                </div>
              )}

              {agent.lat && agent.lng && (
                <a href={`https://www.google.com/maps/search/?api=1&query=${agent.lat},${agent.lng}`}
                  target="_blank" rel="noreferrer"
                  style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',
                    borderRadius:12,background:'#fff',border:'1.5px solid var(--bdr)',textDecoration:'none',color:'var(--txt)'}}>
                  <span style={{fontSize:22}}>🗺</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:14,color:'var(--txt)'}}>Xem trên bản đồ</div>
                    <div style={{fontSize:11,color:'var(--txt3)',marginTop:2}}>{agent.loc || 'Lâm Đồng'}</div>
                  </div>
                  <span style={{color:'var(--txt3)',fontSize:16}}>›</span>
                </a>
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
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {agent.products.map((p, i) => (
                    <div key={p.id || i} style={{background:'#fff',borderRadius:12,border:'1.5px solid var(--bdr)',padding:'14px 16px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:700,fontSize:14,color:'var(--txt)'}}>{p.name}</div>
                          <div style={{fontSize:11,color:p.category==='phan_bon'?'var(--green)':'var(--blue)',fontWeight:600,marginTop:3}}>
                            {p.category === 'phan_bon' ? '🌱 Phân bón' : p.category === 'thuoc_bvtv' ? '🧪 Thuốc BVTV' : '📦 Khác'}
                          </div>
                          {p.description && <div style={{fontSize:12,color:'var(--txt3)',marginTop:5,lineHeight:1.5}}>{p.description}</div>}
                        </div>
                        <div style={{textAlign:'right',flexShrink:0}}>
                          <div style={{fontSize:15,fontWeight:800,color:'var(--green)',fontFamily:'JetBrains Mono,monospace'}}>{fmt(p.price)}đ</div>
                          <div style={{fontSize:11,color:'var(--txt3)',marginTop:2}}>/{p.unit}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div>
              {(!agent.price_history || agent.price_history.length === 0) ? (
                <div style={{textAlign:'center',padding:'48px 20px',color:'var(--txt3)'}}>
                  <div style={{fontSize:40,marginBottom:12}}>📈</div>
                  <div style={{fontWeight:600,fontSize:15,color:'var(--txt2)',marginBottom:6}}>Chưa có lịch sử</div>
                  <div style={{fontSize:13}}>Đại lý chưa cập nhật giá lần nào</div>
                </div>
              ) : (
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
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
