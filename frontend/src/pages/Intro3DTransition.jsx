import { useEffect, useRef, useState } from 'react'

export default function Intro3DTransition({ onComplete }) {
  const canvasRef = useRef(null)
  const [fading, setFading] = useState(false)
  const [stage, setStage] = useState('Initializing AI Neural Engine...')

  useEffect(() => {
    // Stage messages over 3s duration
    const timer1 = setTimeout(() => setStage('Loading Candidate Analytics...'), 1000)
    const timer2 = setTimeout(() => setStage('Syncing Mock Assessment Data...'), 2000)
    const timer3 = setTimeout(() => {
      handleComplete()
    }, 2800)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [])

  const handleComplete = () => {
    setFading(true)
    setTimeout(() => {
      if (onComplete) onComplete()
    }, 500)
  }

  // 3D Starfield / Particle Matrix canvas animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    const particles = Array.from({ length: 90 }, () => ({
      x: (Math.random() - 0.5) * width * 2,
      y: (Math.random() - 0.5) * height * 2,
      z: Math.random() * width,
      size: Math.random() * 2 + 1,
    }))

    const render = () => {
      ctx.fillStyle = '#070b14'
      ctx.fillRect(0, 0, width, height)

      const cx = width / 2
      const cy = height / 2

      particles.forEach(p => {
        p.z -= 4
        if (p.z <= 0) {
          p.z = width
          p.x = (Math.random() - 0.5) * width * 2
          p.y = (Math.random() - 0.5) * height * 2
        }

        const k = 300 / p.z
        const px = p.x * k + cx
        const py = p.y * k + cy

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const alpha = Math.min(1, (1 - p.z / width) * 1.5)
          const radius = p.size * k

          ctx.beginPath()
          ctx.arc(px, py, radius, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(147, 197, 253, ${alpha})`
          ctx.fill()
        }
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className={`intro-3d-overlay ${fading ? 'intro-3d-overlay--fade' : ''}`}>
      <canvas ref={canvasRef} className="intro-3d-canvas" />
      <div className="intro-3d-content">
        <div className="intro-3d-logo">MIRROR</div>
        <div className="intro-3d-stage">
          <div className="intro-3d-spinner" />
          <span>{stage}</span>
        </div>
      </div>
      <button className="intro-3d-skip" onClick={handleComplete}>
        Skip Intro
      </button>
    </div>
  )
}
