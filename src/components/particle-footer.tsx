"use client";

import { useEffect, useRef } from "react";

type Particle = { x: number; y: number; tx: number; ty: number; vx: number; vy: number; seed: number };

export function ParticleFooter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let particles: Particle[] = []; let animation = 0; let mouse = { x: -9999, y: -9999 }; let disperse = 0; let active = true;
    const setup = () => { const box = canvas.getBoundingClientRect(); const dpr = Math.min(devicePixelRatio, 2); canvas.width = box.width * dpr; canvas.height = box.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); const off = document.createElement("canvas"); off.width = Math.floor(box.width); off.height = Math.floor(box.height); const octx = off.getContext("2d"); if (!octx) return; octx.fillStyle = "white"; octx.font = `900 ${Math.min(box.width * .22, 180)}px Arial`; octx.textAlign = "center"; octx.textBaseline = "middle"; octx.fillText("PEROT", box.width / 2, box.height / 2); const image = octx.getImageData(0, 0, off.width, off.height).data; particles = []; const gap = box.width < 700 ? 6 : 5; for (let y = 0; y < off.height; y += gap) for (let x = 0; x < off.width; x += gap) if (image[(y * off.width + x) * 4 + 3] > 100) particles.push({ x, y, tx: x, ty: y, vx: 0, vy: 0, seed: Math.random() }); };
    const render = () => { if (!active) { animation = requestAnimationFrame(render); return; } const box = canvas.getBoundingClientRect(); ctx.clearRect(0, 0, box.width, box.height); const target = Math.min(1, Math.max(0, (window.innerHeight - box.top) / window.innerHeight)); disperse += (target - disperse) * .04; for (const p of particles) { const dx = p.x - mouse.x; const dy = p.y - mouse.y; const distance = Math.hypot(dx, dy) || 1; const force = distance < 110 ? (110 - distance) / 110 : 0; const spreadX = (p.seed - .5) * disperse * 120; const spreadY = (p.seed - .5) * disperse * 90; p.vx += ((p.tx + spreadX - p.x) * .025) + (dx / distance) * force * 1.8; p.vy += ((p.ty + spreadY - p.y) * .025) + (dy / distance) * force * 1.8; p.vx *= .83; p.vy *= .83; p.x += p.vx; p.y += p.vy; ctx.fillStyle = `rgba(255,255,255,${.45 + (1 - disperse) * .55})`; ctx.fillRect(p.x, p.y, 2, 2); } animation = requestAnimationFrame(render); };
    const move = (event: PointerEvent) => { const r = canvas.getBoundingClientRect(); mouse = { x: event.clientX - r.left, y: event.clientY - r.top }; };
    const leave = () => { mouse = { x: -9999, y: -9999 }; };
    const visibility = () => { active = !document.hidden; };
    setup(); render(); window.addEventListener("resize", setup); canvas.addEventListener("pointermove", move); canvas.addEventListener("pointerleave", leave); document.addEventListener("visibilitychange", visibility);
    return () => { cancelAnimationFrame(animation); window.removeEventListener("resize", setup); canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerleave", leave); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  return <div className="particle-footer"><div><span>05 / INTERACTION</span><p>SCROLL · MOVE · REFORM</p></div><canvas ref={canvasRef} aria-label="随滚动和指针运动的 PEROT 粒子文字" /><p className="particle-copy">向下滚动，文字离散。移动指针，粒子会响应你的方向。离开后，它回到原点。</p></div>;
}
