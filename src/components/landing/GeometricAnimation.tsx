"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface GeometricAnimationProps {
  className?: string;
  style?: React.CSSProperties;
  /** Override the primary color from theme */
  primaryColorOverride?: string;
}

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  connections: number[];
}

interface MouseState {
  x: number;  // Actual mouse position
  y: number;
  smoothX: number;  // Smoothed/interpolated position (what animation uses)
  smoothY: number;
  prevX: number;
  prevY: number;
  isMoving: boolean;
  velocity: number;
}

// Simplified mouse state for drawing functions
interface DrawMouse {
  x: number;
  y: number;
  isMoving: boolean;
  velocity: number;
}

interface GyroState {
  x: number; // gamma (left/right tilt)
  y: number; // beta (front/back tilt)
  enabled: boolean;
}

interface PortalParticle {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  alpha: number;
  layer: number;
  // For 3D wormhole path
  pathProgress: number; // 0 to 1 along the wormhole path
}

/**
 * Dynamic, interactive geometric animation with mouse tracking
 * Features: particle physics, connection lines, mouse attraction/repulsion,
 * ripple effects, and fluid motion
 */
export default function GeometricAnimation({ className = "", style, primaryColorOverride }: GeometricAnimationProps) {
  const { theme } = useTheme();
  const primaryColor = primaryColorOverride || theme?.primaryColor || "#6366f1";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<MouseState>({
    x: -1000,
    y: -1000,
    smoothX: -1000,  // Starts off-screen
    smoothY: -1000,
    prevX: -1000,
    prevY: -1000,
    isMoving: false,
    velocity: 0,
  });
  const rippleRef = useRef<{ x: number; y: number; radius: number; alpha: number }[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const timeRef = useRef(0);
  const gyroRef = useRef<GyroState>({ x: 0, y: 0, enabled: false });
  const portalParticlesRef = useRef<PortalParticle[]>([]);
  const [gyroPermissionGranted, setGyroPermissionGranted] = useState(false);

  // Parse hex color to RGB
  const hexToRgb = useCallback((hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      };
    }
    // Default to indigo if parsing fails
    return { r: 99, g: 102, b: 241 };
  }, []);

  // Initialize portal particles for 3D wormhole
  const initPortalParticles = useCallback(() => {
    const particles: PortalParticle[] = [];
    const numParticles = 200;

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: 0, // Will be calculated based on pathProgress
        speed: 0.3 + Math.random() * 0.8,
        size: 1.5 + Math.random() * 3.5,
        alpha: 0.3 + Math.random() * 0.5,
        layer: Math.floor(Math.random() * 3),
        pathProgress: Math.random(), // Random position along the wormhole
      });
    }

    portalParticlesRef.current = particles;
  }, []);

  // Initialize particles
  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = [];
    const numParticles = Math.min(80, Math.floor((width * height) / 15000));
    const rgb = hexToRgb(primaryColor);

    for (let i = 0; i < numParticles; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      particles.push({
        x,
        y,
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 3 + 2,
        color: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, `,
        alpha: Math.random() * 0.5 + 0.3,
        connections: [],
      });
    }

    // Pre-calculate potential connections (within threshold distance)
    const connectionThreshold = 200;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].baseX - particles[j].baseX;
        const dy = particles[i].baseY - particles[j].baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < connectionThreshold) {
          particles[i].connections.push(j);
        }
      }
    }

    particlesRef.current = particles;
    initPortalParticles();
  }, [primaryColor, hexToRgb, initPortalParticles]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
        initParticles(rect.width, rect.height);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [initParticles]);

  // Accelerometer/Gyroscope support
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      // gamma: left/right tilt (-90 to 90)
      // beta: front/back tilt (-180 to 180)
      const gamma = event.gamma || 0;
      const beta = event.beta || 0;
      
      // Normalize to -1 to 1 range and apply smoothing
      const targetX = Math.max(-1, Math.min(1, gamma / 45));
      const targetY = Math.max(-1, Math.min(1, (beta - 45) / 45)); // Center at 45 degrees (phone tilted slightly back)
      
      // Smooth the values
      gyroRef.current.x += (targetX - gyroRef.current.x) * 0.1;
      gyroRef.current.y += (targetY - gyroRef.current.y) * 0.1;
      gyroRef.current.enabled = true;
    };

    // Request permission for iOS 13+
    const requestPermission = async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
            setGyroPermissionGranted(true);
          }
        } catch (error) {
          console.log('Gyroscope permission denied');
        }
      } else {
        // Non-iOS devices - just add the listener
        window.addEventListener('deviceorientation', handleOrientation);
        setGyroPermissionGranted(true);
      }
    };

    // Check if DeviceOrientationEvent is available
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      // For non-iOS, we can add the listener directly
      if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    }

    // Expose request permission function to be called on user interaction
    (window as any).__requestGyroPermission = requestPermission;

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // Mouse and touch tracking
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let moveTimeout: NodeJS.Timeout;

    const updatePointer = (x: number, y: number) => {
      const mouse = mouseRef.current;
      
      // Check if this is the first mouse entry (coming from offscreen position)
      const isFirstEntry = mouse.x < 0 || mouse.y < 0;
      
      if (isFirstEntry) {
        // On first entry, set actual position but keep smooth position off-screen
        // This allows smooth interpolation to gradually bring animation to mouse
        mouse.prevX = x;
        mouse.prevY = x;
        mouse.x = x;
        mouse.y = y;
        // smoothX/smoothY stay at -1000, will lerp toward actual position
        mouse.velocity = 0;
        mouse.isMoving = true;
        clearTimeout(moveTimeout);
        moveTimeout = setTimeout(() => {
          mouse.isMoving = false;
        }, 100);
        return;
      }
      
      const dx = x - mouse.x;
      const dy = y - mouse.y;
      mouse.velocity = Math.sqrt(dx * dx + dy * dy);
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
      mouse.x = x;
      mouse.y = y;
      mouse.isMoving = true;

      // Add ripple on fast movement (higher threshold)
      if (mouse.velocity > 30) {
        rippleRef.current.push({
          x,
          y,
          radius: 0,
          alpha: 0.4,
        });
      }

      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        mouse.isMoving = false;
      }, 100);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      updatePointer(e.clientX - rect.left, e.clientY - rect.top);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = container.getBoundingClientRect();
        const touch = e.touches[0];
        updatePointer(touch.clientX - rect.left, touch.clientY - rect.top);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = container.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // Reset previous position on new touch to avoid huge velocity
        mouseRef.current.prevX = x;
        mouseRef.current.prevY = y;
        updatePointer(x, y);
        
        // Add ripple on touch start
        rippleRef.current.push({
          x,
          y,
          radius: 0,
          alpha: 0.5,
        });
      }
    };

    const handlePointerLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
      // smoothX/smoothY will gradually lerp to -1000, creating smooth exit
      mouseRef.current.isMoving = false;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Add burst of ripples on click
      for (let i = 0; i < 3; i++) {
        rippleRef.current.push({
          x,
          y,
          radius: i * 20,
          alpha: 0.6 - i * 0.15,
        });
      }
    };

    // Mouse events
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handlePointerLeave);
    container.addEventListener("click", handleClick);
    
    // Touch events
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handlePointerLeave);
    container.addEventListener("touchcancel", handlePointerLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handlePointerLeave);
      container.removeEventListener("click", handleClick);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handlePointerLeave);
      container.removeEventListener("touchcancel", handlePointerLeave);
      clearTimeout(moveTimeout);
    };
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rgb = hexToRgb(primaryColor);
    const particles = particlesRef.current;

    const animate = () => {
      timeRef.current += 0.01;
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      const mouseRaw = mouseRef.current;
      
      // Smoothly interpolate smoothX/smoothY toward actual mouse position
      // This is the key to graceful movement - never snap, always lerp
      const lerpFactor = 0.15; // 15% per frame - responsive but smooth
      
      if (mouseRaw.x > 0 && mouseRaw.y > 0) {
        // Mouse is in canvas - lerp smooth position toward actual
        if (mouseRaw.smoothX < 0) {
          // First time - start from canvas center for graceful entry
          mouseRaw.smoothX = dimensions.width / 2;
          mouseRaw.smoothY = dimensions.height / 2;
        }
        mouseRaw.smoothX += (mouseRaw.x - mouseRaw.smoothX) * lerpFactor;
        mouseRaw.smoothY += (mouseRaw.y - mouseRaw.smoothY) * lerpFactor;
      } else {
        // Mouse left canvas - lerp smooth position toward off-screen
        mouseRaw.smoothX += (-1000 - mouseRaw.smoothX) * lerpFactor;
        mouseRaw.smoothY += (-1000 - mouseRaw.smoothY) * lerpFactor;
      }
      
      // Use smoothed position for all animation calculations
      const mouse: DrawMouse = {
        x: mouseRaw.smoothX,
        y: mouseRaw.smoothY,
        isMoving: mouseRaw.isMoving,
        velocity: mouseRaw.velocity,
      };
      
      // Mouse is "active" when smooth position is in the canvas
      const mouseActive = mouse.x > 0 && mouse.y > 0;
      
      const mouseInfluenceRadius = 180;
      const mouseAttraction = 0.02;
      const mouseRepulsion = 0.08;

      // Update and draw particles
      particles.forEach((particle, i) => {
        // Mouse interaction
        const dx = mouse.x - particle.x;
        const dy = mouse.y - particle.y;
        const distToMouse = Math.sqrt(dx * dx + dy * dy);

        if (distToMouse < mouseInfluenceRadius && mouseActive) {
          const force = (mouseInfluenceRadius - distToMouse) / mouseInfluenceRadius;
          
          // Attraction to mouse when moving slowly, repulsion when fast
          if (mouse.velocity < 5) {
            particle.vx += (dx / distToMouse) * force * mouseAttraction;
            particle.vy += (dy / distToMouse) * force * mouseAttraction;
          } else {
            particle.vx -= (dx / distToMouse) * force * mouseRepulsion;
            particle.vy -= (dy / distToMouse) * force * mouseRepulsion;
          }
        }

        // Return to base position with spring physics
        const returnForce = 0.01;
        const baseDx = particle.baseX - particle.x;
        const baseDy = particle.baseY - particle.y;
        particle.vx += baseDx * returnForce;
        particle.vy += baseDy * returnForce;

        // Add subtle floating motion
        particle.vx += Math.sin(timeRef.current + i * 0.5) * 0.02;
        particle.vy += Math.cos(timeRef.current + i * 0.3) * 0.02;

        // Apply friction
        particle.vx *= 0.95;
        particle.vy *= 0.95;

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Boundary wrapping
        if (particle.x < -50) particle.x = dimensions.width + 50;
        if (particle.x > dimensions.width + 50) particle.x = -50;
        if (particle.y < -50) particle.y = dimensions.height + 50;
        if (particle.y > dimensions.height + 50) particle.y = -50;

        // Draw particle with glow effect
        const glowRadius = particle.radius * (1 + (distToMouse < mouseInfluenceRadius ? 0.5 : 0));
        
        // Outer glow
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, glowRadius * 3
        );
        gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${particle.alpha * 0.3})`);
        gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, glowRadius * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${particle.alpha})`;
        ctx.fill();
      });

      // Draw connections
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
      ctx.lineWidth = 1;

      particles.forEach((particle, i) => {
        particle.connections.forEach((j) => {
          const other = particles[j];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 200;

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.15;
            
            // Brighten connections near mouse
            const midX = (particle.x + other.x) / 2;
            const midY = (particle.y + other.y) / 2;
            const mouseDist = Math.sqrt(
              Math.pow(mouse.x - midX, 2) + Math.pow(mouse.y - midY, 2)
            );
            const mouseBoost = mouseActive && mouseDist < 150 ? (1 - mouseDist / 150) * 0.3 : 0;

            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha + mouseBoost})`;
            ctx.stroke();
          }
        });
      });

      // Draw mouse trail/aura
      if (mouseActive) {
        const auraGradient = ctx.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, 100 + mouse.velocity * 2
        );
        auraGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.1 + mouse.velocity * 0.003})`);
        auraGradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.03)`);
        auraGradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 100 + mouse.velocity * 2, 0, Math.PI * 2);
        ctx.fillStyle = auraGradient;
        ctx.fill();
      }

      // Update and draw ripples
      rippleRef.current = rippleRef.current.filter((ripple) => {
        ripple.radius += 4;
        ripple.alpha -= 0.015;

        if (ripple.alpha <= 0) return false;

        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${ripple.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        return true;
      });

      // Draw portal vortex effect
      drawPortalVortex(ctx, rgb, mouse, dimensions.width, dimensions.height, timeRef.current);

      // Draw geometric overlay shapes that respond to mouse
      drawGeometricShapes(ctx, rgb, mouse, dimensions.width, dimensions.height, timeRef.current);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [dimensions, primaryColor, hexToRgb]);

  // Calculate point along the 3D wormhole/cornucopia path - CENTERED vertical
  const getWormholePoint = (
    progress: number, // 0 = mouth (facing user), 1 = far end (toward navbar)
    angle: number,
    baseRadius: number,
    mouthX: number,
    mouthY: number,
    endX: number,
    endY: number,
    time: number,
    width: number
  ): { x: number; y: number; scale: number; alpha: number } => {
    // Cubic bezier curve for centered vertical path with subtle curve
    // Control points create a gentle curve going straight up to top center
    const control1X = mouthX; // Stay centered
    const control1Y = mouthY - (mouthY - endY) * 0.35; // Pull upward
    const control2X = endX; // Stay centered
    const control2Y = endY + (mouthY - endY) * 0.25; // Approach from above
    
    // Cubic bezier interpolation for smoother, more dramatic curve
    const t = progress;
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    
    const pathX = mt3 * mouthX + 3 * mt2 * t * control1X + 3 * mt * t2 * control2X + t3 * endX;
    const pathY = mt3 * mouthY + 3 * mt2 * t * control1Y + 3 * mt * t2 * control2Y + t3 * endY;
    
    // Radius decreases along the path (perspective) - cornucopia shape
    const radiusScale = Math.max(0.08, 1 - progress * 0.92); // Shrinks to 8% at far end
    const currentRadius = baseRadius * radiusScale;
    
    // Gentler wobble to prevent glitches
    const wobble = Math.sin(time * 1.5 + progress * 8) * 3 * radiusScale;
    
    // Calculate position on the ring at this path point
    // Tilt the ring based on path direction for 3D effect
    const tiltFactor = Math.min(0.75, progress * 0.75); // More elliptical at far end
    const x = pathX + Math.cos(angle) * (currentRadius + wobble);
    const y = pathY + Math.sin(angle) * (currentRadius + wobble) * (1 - tiltFactor);
    
    // Smoother alpha fade toward the far end
    const alpha = Math.max(0, 1 - progress * 0.6);
    
    return { x, y, scale: radiusScale, alpha };
  };

  // Draw navbar glow zone (top-right activity for glass morphism)
  const drawNavbarGlow = (
    ctx: CanvasRenderingContext2D,
    rgb: { r: number; g: number; b: number },
    width: number,
    height: number,
    time: number
  ) => {
    // Large glowing orb in top-right corner
    const orbX = width * 0.85;
    const orbY = height * 0.08;
    const orbRadius = Math.min(width, height) * 0.25;
    
    // Pulsing glow
    const pulse = 1 + Math.sin(time * 1.5) * 0.15;
    
    // Main glow
    const glowGradient = ctx.createRadialGradient(
      orbX, orbY, 0,
      orbX, orbY, orbRadius * pulse
    );
    glowGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`);
    glowGradient.addColorStop(0.3, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`);
    glowGradient.addColorStop(0.6, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`);
    glowGradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
    ctx.beginPath();
    ctx.arc(orbX, orbY, orbRadius * pulse, 0, Math.PI * 2);
    ctx.fillStyle = glowGradient;
    ctx.fill();
    
    // Secondary smaller orb
    const orb2X = width * 0.75;
    const orb2Y = height * 0.05;
    const orb2Radius = orbRadius * 0.5;
    const pulse2 = 1 + Math.sin(time * 2 + 1) * 0.2;
    
    const glow2Gradient = ctx.createRadialGradient(
      orb2X, orb2Y, 0,
      orb2X, orb2Y, orb2Radius * pulse2
    );
    glow2Gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.18)`);
    glow2Gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.06)`);
    glow2Gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
    ctx.beginPath();
    ctx.arc(orb2X, orb2Y, orb2Radius * pulse2, 0, Math.PI * 2);
    ctx.fillStyle = glow2Gradient;
    ctx.fill();
    
    // Floating particles in top-right zone
    const numParticles = 15;
    for (let i = 0; i < numParticles; i++) {
      const angle = (time * 0.5 + i * (Math.PI * 2 / numParticles));
      const radius = 30 + Math.sin(time + i * 0.5) * 20 + i * 8;
      const px = orbX + Math.cos(angle) * radius;
      const py = orbY + Math.sin(angle) * radius * 0.6;
      const pSize = 1.5 + Math.sin(time * 2 + i) * 0.8;
      const pAlpha = 0.15 + Math.sin(time + i * 0.3) * 0.1;
      
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${pAlpha})`;
      ctx.fill();
    }
    
    // Subtle ring around top-right
    ctx.beginPath();
    ctx.arc(orbX, orbY, orbRadius * 0.7, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.06)`;
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  // Draw 3D cornucopia/wormhole portal effect - MUCH LARGER
  const drawPortalVortex = (
    ctx: CanvasRenderingContext2D,
    rgb: { r: number; g: number; b: number },
    mouse: DrawMouse,
    width: number,
    height: number,
    time: number
  ) => {
    // Draw navbar glow first (behind everything)
    drawNavbarGlow(ctx, rgb, width, height, time);
    
    const gyro = gyroRef.current;
    
    // Portal mouth center (facing user) - CENTERED horizontally
    const baseMouthX = width * 0.5;
    const baseMouthY = height * 0.6;
    
    // Apply gyroscope offset if available (reduced to prevent glitches)
    const gyroOffsetX = gyro.enabled ? gyro.x * 50 : 0;
    const gyroOffsetY = gyro.enabled ? gyro.y * 40 : 0;
    
    // Apply mouse offset (reduced for stability)
    const mouseOffsetX = mouse.x > 0 ? (mouse.x - baseMouthX) * 0.04 : 0;
    const mouseOffsetY = mouse.y > 0 ? (mouse.y - baseMouthY) * 0.04 : 0;
    
    const mouthX = baseMouthX + gyroOffsetX + mouseOffsetX;
    const mouthY = baseMouthY + gyroOffsetY + mouseOffsetY;
    
    // Far end of wormhole (toward TOP CENTER, past navbar)
    const endX = width * 0.5 + gyroOffsetX * 0.3;
    const endY = -80; // Extends well past top edge toward navbar
    
    const portalParticles = portalParticlesRef.current;
    const mouthRadius = Math.min(width, height) * 0.35; // MUCH larger - 35% of smallest dimension
    
    // Draw wormhole tunnel structure (rings from far to near for proper layering)
    const numRings = 18; // More rings for smoother tunnel
    for (let ring = numRings - 1; ring >= 0; ring--) {
      const progress = ring / (numRings - 1);
      const ringRotation = time * (ring % 2 === 0 ? 0.3 : -0.2) + ring * 0.25;
      const pulse = 1 + Math.sin(time * 1.5 + ring * 0.4) * 0.06;
      
      // Get center point of this ring along the path
      const centerPoint = getWormholePoint(progress, 0, 0, mouthX, mouthY, endX, endY, time, width);
      
      // Calculate ring size with perspective
      const perspectiveRadius = mouthRadius * Math.max(0.08, (1 - progress * 0.92)) * pulse;
      const tiltFactor = Math.min(0.75, progress * 0.75);
      
      // Ring alpha - brighter at mouth, fading toward far end
      const ringAlpha = Math.max(0.02, (0.15 - progress * 0.1) * (1 + Math.sin(time + ring) * 0.15));
      
      ctx.save();
      ctx.translate(centerPoint.x, centerPoint.y);
      ctx.rotate(ringRotation);
      
      // Draw elliptical ring (tilted for 3D perspective)
      ctx.beginPath();
      const segments = 32; // More segments for smoother rings
      for (let s = 0; s < segments; s++) {
        const segAngle = (s / segments) * Math.PI * 2;
        const nextAngle = ((s + 0.65) / segments) * Math.PI * 2;
        
        const sx = Math.cos(segAngle) * perspectiveRadius;
        const sy = Math.sin(segAngle) * perspectiveRadius * (1 - tiltFactor);
        const nx = Math.cos(nextAngle) * perspectiveRadius;
        const ny = Math.sin(nextAngle) * perspectiveRadius * (1 - tiltFactor);
        
        ctx.moveTo(sx, sy);
        ctx.lineTo(nx, ny);
      }
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${ringAlpha})`;
      ctx.lineWidth = Math.max(0.5, 1.5 + (1 - progress) * 2);
      ctx.stroke();
      
      ctx.restore();
    }
    
    // Draw wormhole edge/wall lines connecting rings - more lines for dramatic effect
    const wallLines = 12;
    for (let w = 0; w < wallLines; w++) {
      ctx.beginPath();
      const wallAngle = (w / wallLines) * Math.PI * 2 + time * 0.15;
      
      for (let p = 0; p <= 30; p++) {
        const progress = p / 30;
        const point = getWormholePoint(progress, wallAngle, mouthRadius * 0.95, mouthX, mouthY, endX, endY, time, width);
        
        if (p === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      }
      const wallAlpha = 0.03 + Math.sin(time + w) * 0.01;
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${wallAlpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // Update and draw portal particles traveling through wormhole
    portalParticles.forEach((particle, i) => {
      // Move particle along the wormhole path (smoother speed)
      particle.pathProgress += particle.speed * 0.006;
      particle.angle += particle.speed * 0.025;
      
      // Reset particle when it reaches the far end (smooth reset)
      if (particle.pathProgress > 1) {
        particle.pathProgress = 0;
        particle.angle = Math.random() * Math.PI * 2;
        particle.speed = 0.3 + Math.random() * 0.7;
      }
      
      // Get particle position along the wormhole
      const point = getWormholePoint(
        particle.pathProgress,
        particle.angle,
        mouthRadius * 0.85,
        mouthX,
        mouthY,
        endX,
        endY,
        time,
        width
      );
      
      // Calculate particle appearance based on depth (smoother transitions)
      const depthAlpha = Math.max(0, particle.alpha * point.alpha * (1 - particle.layer * 0.12));
      const depthSize = Math.max(0.3, particle.size * point.scale * (1 - particle.layer * 0.08));
      
      // Skip if too faded or too small
      if (depthAlpha < 0.015 || depthSize < 0.3) return;
      
      // Draw particle trail (longer for dramatic effect)
      const trailLength = 4;
      for (let t = 0; t < trailLength; t++) {
        const trailProgress = Math.max(0, particle.pathProgress - t * 0.015);
        const trailAngle = particle.angle - t * particle.speed * 0.015;
        const trailPoint = getWormholePoint(
          trailProgress,
          trailAngle,
          mouthRadius * 0.85,
          mouthX,
          mouthY,
          endX,
          endY,
          time,
          width
        );
        
        const trailAlpha = Math.max(0, depthAlpha * (1 - t / trailLength) * 0.35);
        const trailSize = Math.max(0.2, depthSize * (1 - t * 0.12));
        
        ctx.beginPath();
        ctx.arc(trailPoint.x, trailPoint.y, trailSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${trailAlpha})`;
        ctx.fill();
      }
      
      // Main particle
      ctx.beginPath();
      ctx.arc(point.x, point.y, depthSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${depthAlpha})`;
      ctx.fill();
    });
    
    // Draw mouth glow (main opening facing user) - LARGER
    const mouthGlowGradient = ctx.createRadialGradient(
      mouthX, mouthY, 0,
      mouthX, mouthY, mouthRadius * 1.3
    );
    mouthGlowGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.18)`);
    mouthGlowGradient.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`);
    mouthGlowGradient.addColorStop(0.7, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.03)`);
    mouthGlowGradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
    ctx.beginPath();
    ctx.arc(mouthX, mouthY, mouthRadius * 1.3, 0, Math.PI * 2);
    ctx.fillStyle = mouthGlowGradient;
    ctx.fill();
    
    // Inner event horizon at mouth (dark center) - larger
    const horizonRadius = mouthRadius * 0.25;
    const horizonGradient = ctx.createRadialGradient(
      mouthX, mouthY, 0,
      mouthX, mouthY, horizonRadius
    );
    horizonGradient.addColorStop(0, `rgba(0, 0, 0, 0.92)`);
    horizonGradient.addColorStop(0.5, `rgba(${Math.floor(rgb.r * 0.15)}, ${Math.floor(rgb.g * 0.15)}, ${Math.floor(rgb.b * 0.15)}, 0.6)`);
    horizonGradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
    ctx.beginPath();
    ctx.arc(mouthX, mouthY, horizonRadius, 0, Math.PI * 2);
    ctx.fillStyle = horizonGradient;
    ctx.fill();
    
    // Multiple bright rims at the mouth opening for depth
    ctx.beginPath();
    ctx.arc(mouthX, mouthY, mouthRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Secondary rim
    ctx.beginPath();
    ctx.arc(mouthX, mouthY, mouthRadius * 0.75, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Third inner rim
    ctx.beginPath();
    ctx.arc(mouthX, mouthY, mouthRadius * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.06)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  // Draw animated geometric shapes
  const drawGeometricShapes = (
    ctx: CanvasRenderingContext2D,
    rgb: { r: number; g: number; b: number },
    mouse: DrawMouse,
    width: number,
    height: number,
    time: number
  ) => {
    const gyro = gyroRef.current;
    
    // Central rotating hexagon that follows mouse/gyro
    const baseCenterX = width / 2;
    const baseCenterY = height / 2;
    
    // Apply gyroscope offset
    const gyroOffsetX = gyro.enabled ? gyro.x * 80 : 0;
    const gyroOffsetY = gyro.enabled ? gyro.y * 80 : 0;
    
    const centerX = baseCenterX + gyroOffsetX + (mouse.x > 0 ? (mouse.x - baseCenterX) * 0.05 : 0);
    const centerY = baseCenterY + gyroOffsetY + (mouse.y > 0 ? (mouse.y - baseCenterY) * 0.05 : 0);
    const hexRadius = Math.min(width, height) * 0.2;
    const rotation = time * 0.3;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    // Outer hexagon
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = Math.cos(angle) * hexRadius;
      const y = Math.sin(angle) * hexRadius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Inner hexagon with different rotation
    ctx.rotate(-rotation * 2);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = Math.cos(angle) * (hexRadius * 0.6);
      const y = Math.sin(angle) * (hexRadius * 0.6);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
    ctx.stroke();

    ctx.restore();

    // Corner triangles that react to mouse proximity
    const corners = [
      { x: width * 0.1, y: height * 0.1 },
      { x: width * 0.9, y: height * 0.1 },
      { x: width * 0.1, y: height * 0.9 },
      { x: width * 0.9, y: height * 0.9 },
    ];

    corners.forEach((corner, idx) => {
      const distToMouse = mouse.x > 0 
        ? Math.sqrt(Math.pow(mouse.x - corner.x, 2) + Math.pow(mouse.y - corner.y, 2))
        : 1000;
      const scale = 1 + (distToMouse < 200 ? (1 - distToMouse / 200) * 0.3 : 0);
      const triangleSize = 40 * scale;
      const triangleRotation = time * (idx % 2 === 0 ? 0.5 : -0.5);

      ctx.save();
      ctx.translate(corner.x, corner.y);
      ctx.rotate(triangleRotation);
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const angle = (Math.PI * 2 / 3) * i - Math.PI / 2;
        const x = Math.cos(angle) * triangleSize;
        const y = Math.sin(angle) * triangleSize;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.05 + (scale - 1) * 0.2})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    });

    // Floating squares along the sides
    const squares = [
      { x: width * 0.5, y: height * 0.08 },
      { x: width * 0.5, y: height * 0.92 },
      { x: width * 0.08, y: height * 0.5 },
      { x: width * 0.92, y: height * 0.5 },
    ];

    squares.forEach((square, idx) => {
      const distToMouse = mouse.x > 0 
        ? Math.sqrt(Math.pow(mouse.x - square.x, 2) + Math.pow(mouse.y - square.y, 2))
        : 1000;
      const pulseScale = 1 + Math.sin(time * 2 + idx) * 0.1;
      const mouseScale = distToMouse < 150 ? (1 - distToMouse / 150) * 0.2 : 0;
      const size = 25 * (pulseScale + mouseScale);
      const squareRotation = time * 0.8 + idx * Math.PI / 2;

      ctx.save();
      ctx.translate(square.x, square.y);
      ctx.rotate(squareRotation);
      ctx.beginPath();
      ctx.rect(-size / 2, -size / 2, size, size);
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.06)`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    });

    // Orbiting dots around center
    const numOrbits = 3;
    for (let orbit = 0; orbit < numOrbits; orbit++) {
      const orbitRadius = hexRadius * (0.8 + orbit * 0.4);
      const numDots = 6 + orbit * 2;
      const orbitSpeed = (orbit % 2 === 0 ? 1 : -1) * (0.3 + orbit * 0.1);

      for (let i = 0; i < numDots; i++) {
        const angle = (Math.PI * 2 / numDots) * i + time * orbitSpeed;
        const x = centerX + Math.cos(angle) * orbitRadius;
        const y = centerY + Math.sin(angle) * orbitRadius;
        
        const distToMouse = mouse.x > 0 
          ? Math.sqrt(Math.pow(mouse.x - x, 2) + Math.pow(mouse.y - y, 2))
          : 1000;
        const dotSize = 2 + (distToMouse < 100 ? (1 - distToMouse / 100) * 3 : 0);
        const dotAlpha = 0.15 + (distToMouse < 100 ? (1 - distToMouse / 100) * 0.3 : 0);

        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${dotAlpha})`;
        ctx.fill();
      }
    }

    // Grid lines that distort near mouse (subtle)
    const gridSize = 80;
    const gridDistortion = 30;
    
    ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.03)`;
    ctx.lineWidth = 0.5;

    // Vertical lines
    for (let x = gridSize; x < width; x += gridSize) {
      ctx.beginPath();
      for (let y = 0; y <= height; y += 10) {
        const distToMouse = mouse.x > 0 
          ? Math.sqrt(Math.pow(mouse.x - x, 2) + Math.pow(mouse.y - y, 2))
          : 1000;
        const distortion = distToMouse < 150 
          ? Math.sin(y * 0.02 + time * 3) * gridDistortion * (1 - distToMouse / 150)
          : 0;
        
        if (y === 0) ctx.moveTo(x + distortion, y);
        else ctx.lineTo(x + distortion, y);
      }
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = gridSize; y < height; y += gridSize) {
      ctx.beginPath();
      for (let x = 0; x <= width; x += 10) {
        const distToMouse = mouse.x > 0 
          ? Math.sqrt(Math.pow(mouse.x - x, 2) + Math.pow(mouse.y - y, 2))
          : 1000;
        const distortion = distToMouse < 150 
          ? Math.sin(x * 0.02 + time * 3) * gridDistortion * (1 - distToMouse / 150)
          : 0;
        
        if (x === 0) ctx.moveTo(x, y + distortion);
        else ctx.lineTo(x, y + distortion);
      }
      ctx.stroke();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden cursor-crosshair ${className}`}
      style={style}
    >
      {/* Base gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, 
            color-mix(in srgb, ${primaryColor} 12%, #000) 0%, 
            #050505 50%), 
            radial-gradient(ellipse at 80% 80%, 
            color-mix(in srgb, ${primaryColor} 8%, #000) 0%, 
            transparent 50%)`,
        }}
      />

      {/* Interactive canvas */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0 w-full h-full"
      />

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 30%, rgba(0, 0, 0, 0.4) 100%)`,
        }}
      />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
