import { useEffect, useRef } from 'react'

export default function useSwipeBack(onBack, enabled = true) {
  const state = useRef({ startX: 0, startY: 0, tracking: false })

  useEffect(() => {
    if (!enabled) return

    const onTouchStart = (e) => {
      if (e.touches[0].clientX > 40) return // Only start from left edge
      if (window.innerWidth && window.innerWidth > 768) return // Only on mobile
      state.current.startX = e.touches[0].clientX
      state.current.startY = e.touches[0].clientY
      state.current.tracking = true
      document.body.style.overflowX = 'hidden' // Prevent native routing glitches
    }

    const onTouchMove = (e) => {
      if (!state.current.tracking) return
      const dx = e.touches[0].clientX - state.current.startX
      const dy = Math.abs(e.touches[0].clientY - state.current.startY)
      
      // If user swipes more vertically than horizontally, cancel tracking
      if (dy > dx && dy > 15) {
        state.current.tracking = false
        const root = document.getElementById('root') || document.body
        root.style.transform = 'translateX(0px)'
        return
      }
      
      if (dx > 0) {
        const root = document.getElementById('root') || document.body
        root.style.transition = 'none'
        // Add resistance/friction to the swipe
        const translate = Math.min(dx * 0.85, window.innerWidth)
        root.style.transform = `translateX(${translate}px)`
      }
    }

    const onTouchEnd = (e) => {
      if (!state.current.tracking) return
      state.current.tracking = false
      const dx = e.changedTouches[0].clientX - state.current.startX
      const root = document.getElementById('root') || document.body

      if (dx > window.innerWidth * 0.35 || dx > 120) {
        // Complete the swipe out
        root.style.transition = 'transform 0.25s cubic-bezier(0.2,0.8,0.2,1)'
        root.style.transform = `translateX(${window.innerWidth}px)`
        setTimeout(() => {
          onBack()
          // Instantly reset position after navigating back
          root.style.transition = 'none'
          root.style.transform = 'translateX(0px)'
        }, 250)
      } else {
        // Revert swipe
        root.style.transition = 'transform 0.2s cubic-bezier(0.2,0.8,0.2,1)'
        root.style.transform = 'translateX(0px)'
        setTimeout(() => { root.style.transition = 'none' }, 200)
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
  }, [onBack, enabled])
}
