import { useEffect, useRef } from 'react'

export default function usePullToRefresh(onRefresh, enabled = true) {
  const startY = useRef(0)
  const pulling = useRef(false)
  const indicator = useRef(null)

  useEffect(() => {
    if (!enabled) return

    const showIndicator = () => {
      if (indicator.current) return
      const el = document.createElement('div')
      el.style.cssText = `
        position:fixed;top:calc(env(safe-area-inset-top) + 12px);left:50%;
        transform:translateX(-50%);z-index:9999;
        background:rgba(255,255,255,0.92);backdrop-filter:blur(10px);
        border-radius:50%;width:38px;height:38px;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 2px 12px rgba(0,0,0,.18);
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
            border-top-color:#555;
            border-radius:50%;
            animation:_ptr_spin .7s linear infinite;
          }
        </style>
        <div class="_ptr_ring"></div>
      `
      document.body.appendChild(el)
      indicator.current = el
    }

    const hideIndicator = () => {
      if (!indicator.current) return
      const el = indicator.current
      el.style.transition = 'opacity .3s'
      el.style.opacity = '0'
      setTimeout(() => { el.remove(); indicator.current = null }, 300)
    }

    const onTouchStart = (e) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY
        pulling.current = true
      }
    }

    const onTouchEnd = (e) => {
      if (!pulling.current) return
      const dy = e.changedTouches[0].clientY - startY.current
      if (dy > 80) {
        showIndicator()
        setTimeout(() => { hideIndicator(); onRefresh() }, 800)
      }
      pulling.current = false
    }

    window.addEventListener('touchstart', onTouchStart)
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [onRefresh, enabled])
}
