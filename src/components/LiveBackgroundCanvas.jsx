import React, { useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function LiveBackgroundCanvas() {
  const canvasRef = useRef(null);
  const { themeConfig, activePalette } = useTheme();
  const mouseRef = useRef({ x: -1000, y: -1000, isHovering: false });

  const effectMode = themeConfig.canvasEffect || 'particles';
  const speed = themeConfig.canvasSpeed || 1.0;
  const opacity = themeConfig.canvasOpacity || 0.65;
  const particleCount = themeConfig.particleCount || 55;

  useEffect(() => {
    if (effectMode === 'none') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.isHovering = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
      mouseRef.current.isHovering = false;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    // =========================================================================
    // 1. Constellation Particles Setup
    // =========================================================================
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.75 * speed,
        vy: (Math.random() - 0.5) * 0.75 * speed,
        radius: Math.random() * 2.2 + 1.2,
        color: i % 3 === 0 ? activePalette.secondary : activePalette.primary,
        alpha: Math.random() * 0.6 + 0.3,
      });
    }

    // =========================================================================
    // 2. Glowing Orbs Setup
    // =========================================================================
    const orbs = [
      { x: width * 0.2, y: height * 0.3, vx: 0.3 * speed, vy: 0.2 * speed, r: 240, color: activePalette.primary },
      { x: width * 0.8, y: height * 0.6, vx: -0.25 * speed, vy: 0.35 * speed, r: 280, color: activePalette.secondary },
      { x: width * 0.5, y: height * 0.8, vx: 0.2 * speed, vy: -0.3 * speed, r: 220, color: activePalette.primary },
    ];
    let mouseOrb = { x: width / 2, y: height / 2, r: 200 };

    // =========================================================================
    // Animation Loop
    // =========================================================================
    let time = 0;

    const render = () => {
      time += 0.015 * speed;
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = opacity;

      // -----------------------------------------------------------------------
      // MODE A: Constellation Particles
      // -----------------------------------------------------------------------
      if (effectMode === 'particles') {
        const mouseDistThreshold = 160;
        const lineDistThreshold = 125;

        // Update and draw particles
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx * speed;
          p.y += p.vy * speed;

          if (p.x < 0) p.x = width;
          else if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          else if (p.y > height) p.y = 0;

          // Connect to mouse cursor
          if (mouseRef.current.isHovering) {
            const dxM = mouseRef.current.x - p.x;
            const dyM = mouseRef.current.y - p.y;
            const distM = Math.sqrt(dxM * dxM + dyM * dyM);

            if (distM < mouseDistThreshold) {
              const alphaM = (1 - distM / mouseDistThreshold) * 0.8;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
              ctx.strokeStyle = activePalette.primary;
              ctx.lineWidth = (1 - distM / mouseDistThreshold) * 1.5;
              ctx.globalAlpha = alphaM * opacity;
              ctx.stroke();

              // Subtle gravity pull toward cursor
              p.x += dxM * 0.006 * speed;
              p.y += dyM * 0.006 * speed;
            }
          }

          // Connect between particles
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < lineDistThreshold) {
              const lineAlpha = (1 - dist / lineDistThreshold) * 0.45;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = p.color;
              ctx.lineWidth = 0.8;
              ctx.globalAlpha = lineAlpha * opacity;
              ctx.stroke();
            }
          }

          // Draw node circle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha * opacity;
          ctx.fill();
        }
      }

      // -----------------------------------------------------------------------
      // MODE B: Fluid Sine Waves
      // -----------------------------------------------------------------------
      else if (effectMode === 'waves') {
        const waveCount = 3;
        const baseHeight = height * 0.65;

        for (let w = 0; w < waveCount; w++) {
          ctx.beginPath();
          ctx.moveTo(0, height);

          const waveFreq = 0.0025 + w * 0.001;
          const waveAmp = 45 + w * 25;
          const phaseOffset = time * (0.8 + w * 0.4) + w * 2;

          for (let x = 0; x <= width; x += 12) {
            let mouseInfluence = 0;
            if (mouseRef.current.isHovering) {
              const dx = x - mouseRef.current.x;
              const dist = Math.abs(dx);
              if (dist < 220) {
                mouseInfluence = Math.sin((1 - dist / 220) * Math.PI) * 35;
              }
            }

            const y =
              baseHeight +
              Math.sin(x * waveFreq + phaseOffset) * waveAmp +
              Math.cos(x * 0.0015 - time * 0.5) * (waveAmp * 0.4) +
              mouseInfluence;

            ctx.lineTo(x, y);
          }

          ctx.lineTo(width, height);
          ctx.closePath();

          const grad = ctx.createLinearGradient(0, baseHeight - 60, width, height);
          if (w === 0) {
            grad.addColorStop(0, `${activePalette.primary}33`);
            grad.addColorStop(1, `${activePalette.secondary}08`);
          } else if (w === 1) {
            grad.addColorStop(0, `${activePalette.secondary}25`);
            grad.addColorStop(1, `${activePalette.primary}05`);
          } else {
            grad.addColorStop(0, `${activePalette.primary}18`);
            grad.addColorStop(1, 'transparent');
          }

          ctx.fillStyle = grad;
          ctx.globalAlpha = (0.55 - w * 0.12) * opacity;
          ctx.fill();
        }
      }

      // -----------------------------------------------------------------------
      // MODE C: Glowing Orbs
      // -----------------------------------------------------------------------
      else if (effectMode === 'orbs') {
        // Smooth mouse follower lerp
        if (mouseRef.current.isHovering) {
          mouseOrb.x += (mouseRef.current.x - mouseOrb.x) * 0.08;
          mouseOrb.y += (mouseRef.current.y - mouseOrb.y) * 0.08;

          const mouseGrad = ctx.createRadialGradient(
            mouseOrb.x,
            mouseOrb.y,
            0,
            mouseOrb.x,
            mouseOrb.y,
            mouseOrb.r
          );
          mouseGrad.addColorStop(0, `${activePalette.primary}45`);
          mouseGrad.addColorStop(0.5, `${activePalette.secondary}15`);
          mouseGrad.addColorStop(1, 'transparent');

          ctx.beginPath();
          ctx.arc(mouseOrb.x, mouseOrb.y, mouseOrb.r, 0, Math.PI * 2);
          ctx.fillStyle = mouseGrad;
          ctx.globalAlpha = 0.85 * opacity;
          ctx.fill();
        }

        // Floating autonomous background orbs
        orbs.forEach((orb) => {
          orb.x += orb.vx * speed;
          orb.y += orb.vy * speed;

          if (orb.x < -orb.r) orb.x = width + orb.r;
          if (orb.x > width + orb.r) orb.x = -orb.r;
          if (orb.y < -orb.r) orb.y = height + orb.r;
          if (orb.y > height + orb.r) orb.y = -orb.r;

          const pulseR = orb.r + Math.sin(time + orb.x) * 20;
          const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, pulseR);
          grad.addColorStop(0, `${orb.color}35`);
          grad.addColorStop(0.6, `${orb.color}10`);
          grad.addColorStop(1, 'transparent');

          ctx.beginPath();
          ctx.arc(orb.x, orb.y, pulseR, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.globalAlpha = 0.65 * opacity;
          ctx.fill();
        });
      }

      // -----------------------------------------------------------------------
      // MODE D: Cyber Grid
      // -----------------------------------------------------------------------
      else if (effectMode === 'grid') {
        const gridSize = 48;
        const gridAlpha = 0.12 * opacity;

        ctx.strokeStyle = activePalette.primary;
        ctx.lineWidth = 1;
        ctx.globalAlpha = gridAlpha;

        // Draw vertical lines
        for (let x = 0; x <= width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = 0; y <= height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Highlight cells under/near mouse
        if (mouseRef.current.isHovering) {
          const mX = mouseRef.current.x;
          const mY = mouseRef.current.y;
          const radius = 180;

          const startX = Math.max(0, Math.floor((mX - radius) / gridSize) * gridSize);
          const endX = Math.min(width, Math.ceil((mX + radius) / gridSize) * gridSize);
          const startY = Math.max(0, Math.floor((mY - radius) / gridSize) * gridSize);
          const endY = Math.min(height, Math.ceil((mY + radius) / gridSize) * gridSize);

          for (let gx = startX; gx < endX; gx += gridSize) {
            for (let gy = startY; gy < endY; gy += gridSize) {
              const cx = gx + gridSize / 2;
              const cy = gy + gridSize / 2;
              const dist = Math.sqrt((cx - mX) * (cx - mX) + (cy - mY) * (cy - mY));

              if (dist < radius) {
                const cellAlpha = (1 - dist / radius) * 0.35 * opacity;
                ctx.fillStyle = activePalette.primary;
                ctx.globalAlpha = cellAlpha;
                ctx.fillRect(gx + 1, gy + 1, gridSize - 2, gridSize - 2);

                // Highlight intersection point
                ctx.beginPath();
                ctx.arc(gx, gy, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = activePalette.secondary;
                ctx.globalAlpha = cellAlpha * 2;
                ctx.fill();
              }
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [effectMode, speed, opacity, particleCount, activePalette]);

  if (effectMode === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
    />
  );
}
