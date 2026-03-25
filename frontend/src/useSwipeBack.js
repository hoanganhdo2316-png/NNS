import { useEffect } from 'react'

export default function useSwipeBack(onBack, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    let startX = 0
    let startY = 0

    const onTouchStart = (e) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }

    const onTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - startX
      const dy = Math.abs(e.changedTouches[0].clientY - startY)
      // Vuốt từ trái sang phải, bắt đầu từ cạnh trái (< 40px), ngang hơn dọc
      if (startX < 40 && dx > 60 && dy < 80) {
        onBack()
      }
    }

    window.addEventListener('touchstart', onTouchStart)
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [onBack, enabled])
}
