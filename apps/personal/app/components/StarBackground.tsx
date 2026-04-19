"use client"

import { useEffect, useRef } from "react"
import type * as THREE_TYPES from "three"

/**
 * Drifting ✦ Y2K stars rendered in a Three.js WebGL canvas behind the grid.
 * Very low opacity — purely atmospheric on the paper background.
 */
export function StarBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let cancelled = false
    let animId = 0

    const run = async () => {
      const THREE = await import("three")
      if (cancelled || !containerRef.current) return

      const w = window.innerWidth
      const h = window.innerHeight

      // Renderer
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      renderer.setClearColor(0x000000, 0)
      containerRef.current.appendChild(renderer.domElement)

      // Orthographic camera so stars stay in screen-space
      const camera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 100)
      camera.position.z = 10

      const scene = new THREE.Scene()

      // Build a ✦ glyph onto a small canvas to use as sprite texture
      const glyphCanvas = document.createElement("canvas")
      glyphCanvas.width = 64
      glyphCanvas.height = 64
      const ctx = glyphCanvas.getContext("2d")!
      ctx.clearRect(0, 0, 64, 64)
      ctx.fillStyle = "#c8a84b" // warm gold
      ctx.font = "bold 52px serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("✦", 32, 34)
      const texture = new THREE.CanvasTexture(glyphCanvas)

      // Stars data
      const COUNT = 22
      type Star = {
        sprite: THREE_TYPES.Sprite
        vx: number
        vy: number
        rotSpeed: number
      }
      const stars: Star[] = []

      for (let i = 0; i < COUNT; i++) {
        const opacity = 0.045 + Math.random() * 0.055 // 4.5 – 10%
        const mat = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          opacity,
          depthWrite: false,
        })
        const sprite = new THREE.Sprite(mat)

        const size = 14 + Math.random() * 30
        sprite.scale.set(size, size, 1)
        sprite.position.set(
          (Math.random() - 0.5) * w,
          (Math.random() - 0.5) * h,
          0,
        )

        stars.push({
          sprite,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.12,
          rotSpeed: (Math.random() - 0.5) * 0.004,
        })
        scene.add(sprite)
      }

      const halfW = w / 2
      const halfH = h / 2
      const pad = 60

      const tick = () => {
        if (cancelled) return
        animId = requestAnimationFrame(tick)

        for (const s of stars) {
          s.sprite.position.x += s.vx
          s.sprite.position.y += s.vy
          ;(s.sprite.material as THREE_TYPES.SpriteMaterial).rotation += s.rotSpeed

          // wrap edges
          if (s.sprite.position.x >  halfW + pad) s.sprite.position.x = -(halfW + pad)
          if (s.sprite.position.x < -(halfW + pad)) s.sprite.position.x = halfW + pad
          if (s.sprite.position.y >  halfH + pad) s.sprite.position.y = -(halfH + pad)
          if (s.sprite.position.y < -(halfH + pad)) s.sprite.position.y = halfH + pad
        }

        renderer.render(scene, camera)
      }
      tick()

      const handleResize = () => {
        const nw = window.innerWidth
        const nh = window.innerHeight
        renderer.setSize(nw, nh)
        camera.left   = -nw / 2
        camera.right  =  nw / 2
        camera.top    =  nh / 2
        camera.bottom = -nh / 2
        camera.updateProjectionMatrix()
      }
      window.addEventListener("resize", handleResize)

      return () => {
        window.removeEventListener("resize", handleResize)
        cancelAnimationFrame(animId)
        renderer.dispose()
        texture.dispose()
        if (containerRef.current?.contains(renderer.domElement)) {
          containerRef.current.removeChild(renderer.domElement)
        }
      }
    }

    const cleanupRef: { fn?: () => void } = {}
    run().then((cleanup) => {
      if (cleanup) cleanupRef.fn = cleanup
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(animId)
      cleanupRef.fn?.()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  )
}
