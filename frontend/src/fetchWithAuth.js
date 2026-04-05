// Utility: tự động refresh token khi 401
export async function fetchWithAuth(url, options = {}, tokenKey, refreshKey, API) {
  const token = localStorage.getItem(tokenKey)
  const headers = { ...options.headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  
  let r = await fetch(url, { ...options, headers })
  
  if (r.status === 401) {
    const refreshToken = localStorage.getItem(refreshKey)
    if (!refreshToken) return r
    
    try {
      const rr = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      })
      if (!rr.ok) return r
      const d = await rr.json()
      localStorage.setItem(tokenKey, d.access_token)
      localStorage.setItem(refreshKey, d.refresh_token)
      
      // Retry request với token mới
      const newHeaders = { ...options.headers, Authorization: `Bearer ${d.access_token}`, 'Content-Type': 'application/json' }
      r = await fetch(url, { ...options, headers: newHeaders })
    } catch { return r }
  }
  return r
}
