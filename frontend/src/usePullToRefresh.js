import { useEffect, useRef } from 'react'

export default function usePullToRefresh(onRefresh, enabled = true) {
  const state = useRef({ startY: 0, pulling: false, currentY: 0, active: false })
  const indicator = useRef(null)

  useEffect(() => {
    if (!enabled) return

    const getOrCreateIndicator = () => {
      if (indicator.current) return indicator.current
      const el = document.createElement('div')
      el.style.cssText = `
        position:fixed;top:calc(env(safe-area-inset-top) - 50px);left:50%;
        margin-left:-19px;z-index:9999;
        background:rgba(255,255,255,0.92);backdrop-filter:blur(10px);
        border-radius:50%;width:38px;height:38px;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 3px 14px rgba(0,0,0,.15);
        transition: transform 0s;
        pointer-events: none;
      `
      el.innerHTML = `
        <style>
          @keyframes _ptr_spin {
            from { transform: rotate(0deg) }
            to   { transform: rotate(360deg) }
          }
          ._ptr_ring {
            width:22px;height:22px;
            border:2.5px solid #ddd;
            border-top-color:#1565c0;
            border-radius:50%;
            transition: transform 0s;
          }
          ._ptr_ring.spin {
            animation:_ptr_spin .75s linear infinite;
          }
        </style>
        <div class="_ptr_ring"></div>
      `
      document.body.appendChild(el)
      indicator.current = el
      return el
    }

    const removeIndicator = () => {
      if (!indicator.current) return
      const el = indicator.current
      el.style.transition = 'transform 0.3s cubic-bezier(0.2,0.8,0.2,1), opacity 0.3s'
      el.style.transform = 'translateY(0px)'
      el.style.opacity = '0'
      setTimeout(() => { 
        if (indicator.current === el) {
           el.remove(); indicator.current = null 
        }
      }, 300)
    }

    const onTouchStart = (e) => {
      if (window.scrollY <= 0 && !state.current.active) {
        state.current.startY = e.touches[0].clientY
        state.current.pulling = true
        state.current.currentY = 0
      }
    }

    const onTouchMove = (e) => {
      if (!state.current.pulling || state.current.active) return
      
      const dy = e.touches[0].clientY - state.current.startY
      if (dy > 0) {
        // Prevent default browser refresh when pulling down
        if (e.cancelable) e.preventDefault()
        
        state.current.currentY = dy
        const el = getOrCreateIndicator()
        el.style.opacity = '1'
        el.style.transition = 'none'
        
        // Add elastic resistance
        const resistDy = dy < 150 ? dy * 0.45 : 67.5 + (dy - 150) * 0.15
        el.style.transform = `translateY(${resistDy}px)`
        
        // Rotate the ring based on pull distance
        const ring = el.querySelector('._ptr_ring')
        if (ring && !ring.classList.contains('spin')) {
          ring.style.transform = `rotate(${dy * 1.5}deg)`
        }
      }
    }

    const onTouchEnd = () => {
      if (!state.current.pulling || state.current.active) return
      state.current.pulling = false
      
      const dy = state.current.currentY
      const el = indicator.current
      
      if (dy > 120 && el) { 
        state.current.active = true
        el.style.transition = 'transform 0.3s cubic-bezier(0.2,0.8,0.2,1)'
        el.style.transform = 'translateY(80px)'
        
        const ring = el.querySelector('._ptr_ring')
        if (ring) {
          ring.style.transform = ''
          ring.classList.add('spin')
        }
        
        const res = onRefresh()
        const minWait = new Promise(r => setTimeout(r, 700))
        Promise.all([res instanceof Promise ? res : Promise.resolve(), minWait]).finally(() => {
          state.current.active = false
          removeIndicator()
        })
      } else {
        removeIndicator()
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [onRefresh, enabled])
}
