import { useEffect, useRef } from 'react'

export default function Spinner({ size = 20, color = '#999', style = {} }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const lines = 12
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    let angle = 0
    let frame

    const draw = () => {
      ctx.clearRect(0, 0, size, size)
      const cx = size / 2
      const cy = size / 2
      const r1 = size * 0.28
      const r2 = size * 0.45
      const lw = size * 0.08

      for (let i = 0; i < lines; i++) {
        const a = (i / lines) * Math.PI * 2 + angle
        const opacity = (i / lines) * 0.9 + 0.1
        ctx.beginPath()
        ctx.strokeStyle = color
        ctx.globalAlpha = opacity
        ctx.lineWidth = lw
        ctx.lineCap = 'round'
        ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1)
        ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2)
        ctx.stroke()
      }

      angle += (Math.PI * 2) / lines / 1.5
      frame = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(frame)
  }, [size, color])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, display: 'block', ...style }}
    />
  )
}
