import { useEffect, useState } from 'react'

function DonutChart({ value, total, color }) {
  const pct = total > 0 ? value / total : 0
  const r = 54, cx = 64, cy = 64
  const circ = 2 * Math.PI * r
  const dash = pct * circ
  return (
    <svg width={128} height={128} viewBox="0 0 128 128">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0e6dc" strokeWidth={16}/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={16}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{transition:'stroke-dasharray .6s ease'}}/>
      <text x={cx} y={cy-8} textAnchor="middle" fontSize={22} fontWeight={800} fill={color}>{value}</text>
      <text x={cx} y={cy+12} textAnchor="middle" fontSize={11} fill="#888">/ {total}</text>
    </svg>
  )
}

function LineChart({ data, color, label, yKey='count' }) {
  if (!data || data.length === 0) return <div style={{color:'#aaa',fontSize:12,textAlign:'center',paddingTop:30}}>Chưa có dữ liệu</div>
  const vals = data.map(d => d[yKey] || 0)
  const max = Math.max(...vals, 1)
  const W = 320, H = 80, pad = 8
  const points = vals.map((v, i) => {
    const x = pad + (i / (vals.length - 1 || 1)) * (W - pad * 2)
    const y = H - pad - (v / max) * (H - pad * 2)
    return `${x},${y}`
  }).join(' ')
  const areaPoints = `${pad},${H-pad} ` + points + ` ${W-pad},${H-pad}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:80}}>
      <defs>
        <linearGradient id={`g${label}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2}/>
          <stop offset="100%" stopColor={color} stopOpacity={0}/>
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#g${label})`}/>
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      {vals.map((v,i) => {
        const x = pad + (i/(vals.length-1||1))*(W-pad*2)
        const y = H - pad - (v/max)*(H-pad*2)
        return <circle key={i} cx={x} cy={y} r={2.5} fill={color}/>
      })}
    </svg>
  )
}

export default function AdminDashboard({ agents, users, logs, orange, API, TOKEN_KEY, REFRESH_KEY, fetchWithAuth }) {
  const [dash, setDash] = useState(null)
  const isMobile = window.innerWidth < 900

  useEffect(() => {
    fetchWithAuth(`${API}/admin/dashboard`, {method:'GET'}, TOKEN_KEY, REFRESH_KEY, API)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setDash(d) })
      .catch(() => {})
  }, [])

  const card = {
    background:'#fff', borderRadius:16,
    padding: isMobile ? 14 : 20,
    boxShadow:'0 2px 12px rgba(230,81,0,.07)',
    border:'1px solid #ffe0b2'
  }
  const p = isMobile ? 12 : 24

  return (
    <div style={{padding:p}}>

      {/* Row 1: Stats — 2x2 on mobile, 4x1 on desktop */}
      <div style={{display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: isMobile?10:16, marginBottom: isMobile?10:16}}>
        {[
          {label:'Tổng đại lý',          value: agents.length,                       color:'#e65100', bg:'#fff3e0'},
          {label:'Người dùng',           value: users.length,                        color:'#1565c0', bg:'#e3f2fd'},
          {label:'Nhật ký',              value: logs.length,                         color:'#6a1b9a', bg:'#f3e5f5'},
          {label:'Cập nhật hôm nay',     value: dash?.agents_updated_today ?? '…',   color:'#2e7d32', bg:'#e8f5e9'},
        ].map(t => (
          <div key={t.label} style={{...card, background:t.bg, border:`1.5px solid ${t.color}22`}}>
            <div style={{fontSize: isMobile?22:28, fontWeight:800, color:t.color, fontFamily:'monospace'}}>{t.value}</div>
            <div style={{fontSize: isMobile?11:12, color:'#888', marginTop:4}}>{t.label}</div>
          </div>
        ))}
      </div>

      {/* Row 2: Donut + Line tỷ lệ cập nhật — stack on mobile */}
      <div style={{display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 2fr', gap: isMobile?10:16, marginBottom: isMobile?10:16}}>
        <div style={{...card, display:'flex', flexDirection: isMobile?'row':'column', alignItems:'center', justifyContent:'center', gap: isMobile?16:0}}>
          <DonutChart value={dash?.agents_updated_today??0} total={dash?.agents_total??agents.length} color={orange}/>
          <div style={{textAlign: isMobile?'left':'center'}}>
            <div style={{fontSize:13, fontWeight:700, color:orange, marginBottom:4}}>🏪 Đại lý cập nhật hôm nay</div>
            <div style={{fontSize:12, color:'#888'}}>
              {dash ? `${Math.round(((dash.agents_updated_today||0)/(dash.agents_total||1))*100)}% đã cập nhật` : '…'}
            </div>
          </div>
        </div>
        <div style={card}>
          <div style={{fontSize:13, fontWeight:700, color:orange, marginBottom:8}}>📈 Tỷ lệ cập nhật giá 14 ngày qua</div>
          {dash
            ? <>
                <LineChart data={dash.daily_update_rate} color={orange} label="update" yKey="count"/>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#aaa',marginTop:4}}>
                  <span>{dash.daily_update_rate[0]?.date?.slice(5)}</span>
                  <span>{dash.daily_update_rate.at(-1)?.date?.slice(5)}</span>
                </div>
              </>
            : <div style={{color:'#aaa',fontSize:12,textAlign:'center',paddingTop:30}}>Đang tải…</div>
          }
        </div>
      </div>

      {/* Row 3: Users daily + new 24h — stack on mobile */}
      <div style={{display:'grid', gridTemplateColumns: isMobile?'1fr':'2fr 1fr', gap: isMobile?10:16, marginBottom: isMobile?10:16}}>
        <div style={card}>
          <div style={{fontSize:13, fontWeight:700, color:'#1565c0', marginBottom:8}}>👥 Người dùng mới theo ngày (14 ngày)</div>
          {dash
            ? <>
                <LineChart data={dash.daily_users} color="#1565c0" label="users" yKey="count"/>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#aaa',marginTop:4}}>
                  <span>{dash.daily_users[0]?.date?.slice(5)}</span>
                  <span>{dash.daily_users.at(-1)?.date?.slice(5)}</span>
                </div>
              </>
            : <div style={{color:'#aaa',fontSize:12,textAlign:'center',paddingTop:30}}>Đang tải…</div>
          }
        </div>
        <div style={{...card, display:'flex', flexDirection: isMobile?'row':'column', alignItems:'center', justifyContent:'center', gap: isMobile?20:0}}>
          <div style={{fontSize: isMobile?42:56, fontWeight:800, color:'#1565c0', fontFamily:'monospace', lineHeight:1}}>
            {dash?.new_users_24h ?? '…'}
          </div>
          <div>
            <div style={{fontSize:13, fontWeight:700, color:'#1565c0'}}>🆕 Người dùng mới</div>
            <div style={{fontSize:12, color:'#888', marginTop:4}}>trong 24 giờ qua</div>
          </div>
        </div>
      </div>

      {/* Row 4: Traffic theo giờ */}
      <div style={card}>
        <div style={{fontSize:13, fontWeight:700, color:'#00695c', marginBottom:8}}>📊 Lưu lượng truy cập hôm nay (theo giờ)</div>
        {dash?.traffic_hourly?.length > 0
          ? <>
              <LineChart
                data={Array.from({length:24}, (_,h) => ({
                  count: dash.traffic_hourly.find(t => t._id === h)?.count || 0
                }))}
                color="#00695c" label="traffic" yKey="count"/>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#aaa',marginTop:4}}>
                <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span>
              </div>
            </>
          : <div style={{color:'#aaa',fontSize:12,textAlign:'center',paddingTop:16}}>Chưa có dữ liệu hôm nay</div>
        }
      </div>
    </div>
  )
}
