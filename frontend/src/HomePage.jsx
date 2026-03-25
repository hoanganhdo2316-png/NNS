import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'https://api.nns.id.vn'



const TABS = {
  robusta: { label:'Robusta London', sub:'ICE Futures · USD/tấn' },
  arabica: { label:'Arabica NY',     sub:'ICE Futures · USc/lb'  },
}

const fmt = n => n?.toLocaleString('vi-VN') ?? '—'

function ChangeTag({ val, suffix = '' }) {
  const cls = val > 0 ? 'tag-up' : val < 0 ? 'tag-down' : 'tag-flat'
  const icon = val > 0 ? '▲' : val < 0 ? '▼' : '─'
  return (
    <span className={cls} style={{fontSize:12,fontFamily:'JetBrains Mono,monospace',padding:'2px 7px',borderRadius:6,fontWeight:700,display:'inline-block'}}>
      {icon} {fmt(Math.abs(val))}{suffix}
    </span>
  )
}

// ── Component giá cà phê quốc tế ─────────────────────────
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

  // Quy đổi VND/kg
  const vnd = usdVnd
    ? tab === 'arabica'
      ? Math.round(d.price / 100 * 2.20462 * usdVnd)   // USc/lb → VND/kg
      : Math.round(d.price / 1000 * usdVnd)             // USD/t  → VND/kg
    : null

  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>

      {/* Giá quốc tế */}
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

      {/* Quy đổi VND + tỷ giá */}
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

      {/* Footer */}
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

export default function HomePage() {
  const navigate = useNavigate()
  const [showAd, setShowAd]         = useState(true)
  const [tab, setTab]               = useState('robusta')
  const [showLogin, setShowLogin]   = useState(false)
  const [kg, setKg]                 = useState(1000)
  const [search, setSearch]         = useState('')
  const [usdVnd, setUsdVnd]         = useState(null)
  const [vcbAt, setVcbAt]           = useState('')
  const [coffeePrice, setCoffeePrice] = useState(null)
  const [coffeeLoading, setCoffeeLoading] = useState(true)
  const [agents, setAgents]         = useState([])
  const [agentsLoading, setAgentsLoading] = useState(true)
  const [locationErr, setLocationErr] = useState('')

  // Fetch danh sách đại lý
  useEffect(() => {
    setAgentsLoading(true)
    fetch(`${API}/agents`)
      .then(r => r.json())
      .then(d => { setAgents(d); setAgentsLoading(false) })
      .catch(() => { setLocationErr('Không thể tải danh sách đại lý'); setAgentsLoading(false) })
  }, [])

  
  const AVG = agents.length > 0
    ? Math.round(agents.reduce((s, a) => s + (a.price || 0), 0) / agents.filter(a => a.price > 0).length)
    : 0
  const PREV = AVG
  const total = kg * AVG
  const diff  = 0

  // Fetch tỷ giá
  useEffect(() => {
    fetch(`${API}/exchange-rate`)
      .then(r => r.json())
      .then(d => { setUsdVnd(d.usd_vnd); setVcbAt(d.updated_at) })
      .catch(() => setUsdVnd(25450))
  }, [])

  // Fetch giá cà phê quốc tế
  const loadCoffeePrice = () => {
    setCoffeeLoading(true)
    fetch(`${API}/coffee-price`)
      .then(r => r.json())
      .then(d => { setCoffeePrice(d); setCoffeeLoading(false) })
      .catch(() => setCoffeeLoading(false))
  }

  useEffect(() => {
    loadCoffeePrice()
    const id = setInterval(loadCoffeePrice, 5 * 60 * 1000) // tự refresh 5 phút
    return () => clearInterval(id)
  }, [])

  // Login modal sau 15 giây

useEffect(() => {
  const isLoggedIn = !!localStorage.getItem('agribot_token')
  if (isLoggedIn) return

  // Lần đầu sau 3s
  const first = setTimeout(() => setShowLogin(true), 3000)
  return () => clearTimeout(first)
}, [])

// Mỗi lần đóng modal → 15s sau nhắc lại
useEffect(() => {
  const isLoggedIn = !!localStorage.getItem('agribot_token')
  if (isLoggedIn) return
  if (showLogin) return // đang mở thì không cần đặt timer

  const t = setTimeout(() => setShowLogin(true), 15000)
  return () => clearTimeout(t)
}, [showLogin])







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
        .btn-bot{width:40px;height:40px;flex-shrink:0;background:var(--green);border:none;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(46,125,50,0.3);-webkit-tap-highlight-color:transparent;transition:transform .15s;}
        .btn-bot:active{transform:scale(.92);}

        .main{padding:12px 14px;display:flex;flex-direction:column;gap:12px;}

        .ad{background:linear-gradient(135deg,#fff8e1,#fffde7);border:1.5px solid #ffe082;border-radius:var(--r);padding:12px 14px;position:relative;animation:fadeDown .35s ease;}
        .ad-lbl{font-size:9px;letter-spacing:1.5px;color:#f57f17;font-family:'JetBrains Mono',monospace;margin-bottom:8px;font-weight:600;}
        .ad-body{display:flex;align-items:center;gap:10px;}
        .ad-icon{font-size:26px;flex-shrink:0;}
        .ad-copy h4{font-size:13px;font-weight:700;color:#1a2e1a;}
        .ad-copy p{font-size:12px;color:#5d4037;margin-top:2px;}
        .ad-x{position:absolute;top:8px;right:10px;background:none;border:none;color:#bca058;font-size:16px;cursor:pointer;padding:4px;-webkit-tap-highlight-color:transparent;}

        .card{background:var(--surf);border:1.5px solid var(--bdr);border-radius:var(--r);padding:16px;box-shadow:0 2px 8px rgba(46,125,50,0.06);}
        .asset-row{display:flex;align-items:center;gap:12px;margin-bottom:14px;}
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
          <div className="logo">☕ NNS<small>Giá cà phê Lâm Đồng</small></div>
          <div className="sb">
            <span className="si">🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm đại lý, SĐT..." />
          </div>
          <button className="btn-bot" onClick={()=>navigate('/chat')}>🌿</button>
        </div>

        <div className="main">

          {/* AD */}
          {showAd && (
            <div className="ad">
              <div className="ad-lbl">QUẢNG CÁO</div>
              <button className="ad-x" onClick={()=>setShowAd(false)}>✕</button>
              <div className="ad-body">
                <div className="ad-icon">🌱</div>
                <div className="ad-copy">
                  <h4>Phân bón Đầu Trâu — Ưu đãi tháng 3</h4>
                  <p>Giảm 15% đơn từ 1 tấn. Giao tận nơi Lâm Đồng.</p>
                </div>
              </div>
            </div>
          )}

          {/* ASSET */}
          <div className="card fu d1">
            <div className="asset-row">
              <div className="av">H</div>
              <div className="asset-meta">
                <div className="asset-name">Hoàng Anh</div>
                <div className="asset-live"><span className="dot"/>Cập nhật 08:45</div>
              </div>
              <div className="asset-val">
                <div className="big-num">{fmt(total)}<small> đ</small></div>
                <div style={{marginTop:3,textAlign:'right'}}><ChangeTag val={diff} suffix=" đ"/></div>
              </div>
            </div>
            <div className="divider"/>
            <div className="kg-row">
              <span className="kg-lbl">Khối lượng cà phê</span>
              <div className="kg-wrap">
                <input className="kg-inp" type="number" inputMode="numeric" value={kg} onChange={e=>setKg(Number(e.target.value))} min={0}/>
                <span className="kg-unit">kg</span>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="actions fu d2">
            <button className="act"><span className="act-icon">📋</span><span className="act-lbl">Chốt cà phê</span></button>
            <button className="act"><span className="act-icon">🛒</span><span className="act-lbl">Đặt mua phân</span></button>
            <button className="act dim"><span className="act-icon">⋯</span><span className="act-lbl">Sắp ra mắt</span></button>
          </div>

          {/* CHART CARD — giá quốc tế từ backend */}
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
              .map((a,i) => {
                const c = a.change>0?'tag-up':a.change<0?'tag-down':'tag-flat'
                const arrow = a.change>0?'▲+':a.change<0?'▼':'─'
                return (
                  <div key={a._id} className="ag-row" onClick={()=>navigate(`/agent/${a._id}`)} style={{cursor:'pointer'}}>
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
          </div>

        </div>
      </div>

      {/* LOGIN MODAL */}
      {showLogin && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowLogin(false)}>
          <div className="modal">
            <div className="m-handle"/>
            <button className="m-x" onClick={()=>setShowLogin(false)}>✕</button>
            <div className="m-logo">☕</div>
            <div className="m-title">Đăng nhập NNS</div>
            <div className="m-sub">Theo dõi tài sản & nhận giá theo thời gian thực</div>
            <input className="m-inp" placeholder="Tên đăng nhập" autoCapitalize="none"/>
            <input className="m-inp" placeholder="Mật khẩu" type="password"/>
            <button className="m-btn">🌱 Đăng nhập</button>
            <div className="m-or">hoặc</div>
            <div className="m-reg">Chưa có tài khoản? <a>Đăng ký ngay</a></div>
          </div>
        </div>
      )}
    </>
  )
}
