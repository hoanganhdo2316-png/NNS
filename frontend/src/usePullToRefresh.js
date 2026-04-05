import { useEffect, useRef } from 'react'

export default function usePullToRefresh(onRefresh, enabled = true) {
  const startY = useRef(0)
  const pulling = useRef(false)
  const active = useRef(false)
  const indicatorRef = useRef(null)

  useEffect(() => {
    if (!enabled) return

    const createIndicator = () => {
      const el = document.createElement('div')
      el.id = '__ptr__'
      el.style.cssText = [
        'position:fixed',
        'top:12px',
        'left:50%',
        'transform:translateX(-50%) translateY(-80px)',
        'z-index:9999',
        'width:36px',
        'height:36px',
        'border-radius:50%',
        'background:white',
        'box-shadow:0 2px 12px rgba(0,0,0,.15)',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'transition:transform .2s ease',
        'pointer-events:none',
      ].join(';')
      el.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v6M12 22v-6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M22 12h-6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24"/></svg>`
      document.body.appendChild(el)
      indicatorRef.current = el
      return el
    }

    const showIndicator = (progress) => {
      let el = indicatorRef.current || createIndicator()
      const y = Math.min(progress * 0.4, 60)
      el.style.transition = 'none'
      el.style.transform = `translateX(-50%) translateY(${y - 80}px)`
      el.style.opacity = Math.min(progress / 60, 1).toString()
    }

    const spinIndicator = () => {
      const el = indicatorRef.current
      if (!el) return
      el.style.transition = 'transform .2s ease'
      el.style.transform = 'translateX(-50%) translateY(0px)'
      el.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" stroke-width="2.5" stroke-linecap="round" style="animation:__ptr_spin .7s linear infinite"><style>@keyframes __ptr_spin{to{transform:rotate(360deg)}}</style><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>`
    }

    const hideIndicator = () => {
      const el = indicatorRef.current
      if (!el) return
      el.style.transition = 'transform .3s ease, opacity .3s ease'
      el.style.transform = 'translateX(-50%) translateY(-80px)'
      el.style.opacity = '0'
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el)
        if (indicatorRef.current === el) indicatorRef.current = null
      }, 300)
    }

    const onTouchStart = (e) => {
      if (active.current) return
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY
        pulling.current = true
      }
    }

    const onTouchMove = (e) => {
      if (!pulling.current || active.current) return
      const dy = e.touches[0].clientY - startY.current
      if (dy > 0) showIndicator(dy)
      else { pulling.current = false; hideIndicator() }
    }

    const onTouchEnd = () => {
      if (!pulling.current || active.current) return
      const el = indicatorRef.current
      if (!el) { pulling.current = false; return }

      const currentY = parseFloat(el.style.transform.match(/translateY\((.+)px\)/)?.[1] || '-80')
      pulling.current = false

      if (currentY > -40) {
        active.current = true
        spinIndicator()
        try {
          const result = onRefresh()
          const wait = new Promise(r => setTimeout(r, 800))
          Promise.all([
            result instanceof Promise ? result.catch(() => {}) : Promise.resolve(),
            wait
          ]).finally(() => {
            active.current = false
            hideIndicator()
          })
        } catch {
          active.current = false
          hideIndicator()
        }
      } else {
        hideIndicator()
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      hideIndicator()
    }
  }, [onRefresh, enabled])
}
