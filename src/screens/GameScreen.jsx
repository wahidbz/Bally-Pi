// ============================================================
// GAME SCREEN — Main physics arena
// ============================================================
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BALLS, SKINS, POWERUPS } from '../constants/gameConstants';
import { usePhysicsEngine } from '../hooks/usePhysicsEngine';
import { useParticles } from '../hooks/useParticles';
import { getPowerupUses, consumePowerup } from '../utils/storage';

const MAX_NEXT_LEVEL = 4; // max level for "next ball" preview

export default function GameScreen({
  score, setScore, onGameOver, sound, onShop,
  activeSkinId,
}) {
  const canvasRef        = useRef(null);
  const overlayCanvasRef = useRef(null); // particles overlay
  const containerRef     = useRef(null);
  const aimXRef          = useRef(null);
  const [nextLevel, setNextLevel]   = useState(1);
  const [aimX, setAimX]             = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [canDrop, setCanDrop]       = useState(true);
  const [combo, setCombo]           = useState(0);
  const [comboTimer, setComboTimer] = useState(null);
  const [popups, setPopups]         = useState([]);
  const [powerupUses, setPowerupUses] = useState(getPowerupUses());
  const [shake, setShake]           = useState(false);
  const [dropCooldown, setDropCooldown] = useState(false);

  // Current skin object
  const skinObj = SKINS.find(s => s.id === activeSkinId) || null;

  // Particles
  const particles = useParticles(overlayCanvasRef);

  // Merge handler (stable via ref inside hook)
  const handleMerge = useCallback(({ level, score: pts, x, y }) => {
    const ballData = BALLS[level - 1];
    const color    = ballData?.glowColor || '#00f5ff';

    // Score + combo
    setCombo(prev => {
      const newCombo = Math.min(prev + 1, 7);
      const multipliers = [1, 1.5, 2, 3, 4, 5, 6, 8];
      const mult = multipliers[newCombo] || 8;
      const earned = Math.round(pts * mult);
      setScore(s => s + earned);

      // Score popup
      const popId = Date.now() + Math.random();
      setPopups(ps => [...ps, { id: popId, x, y, text: `+${earned}`, combo: mult > 1 }]);
      setTimeout(() => setPopups(ps => ps.filter(p => p.id !== popId)), 1200);

      return newCombo;
    });

    // Reset combo timer
    if (comboTimer) clearTimeout(comboTimer);
    const t = setTimeout(() => setCombo(0), 2000);
    setComboTimer(t);

    // Particles
    particles.spawnMerge(x, y, level, color);

    // Sound
    sound?.playMerge?.(level);
    if (level >= 5) {
      setShake(true);
      setTimeout(() => setShake(false), 300);
      sound?.haptic?.([30, 10, 50]);
    }

    // Refresh powerup uses
    setPowerupUses(getPowerupUses());
  }, [particles, sound, comboTimer]);

  const handleGameOverCb = useCallback(() => {
    sound?.playGameOver?.();
    sound?.haptic?.([100, 50, 200]);
    setTimeout(() => onGameOver(), 800);
  }, [onGameOver, sound]);

  // Physics engine
  const physics = usePhysicsEngine({
    canvasRef,
    onMerge: handleMerge,
    onGameOver: handleGameOverCb,
    onBallAdded: () => {},
    activeSkin: skinObj,
  });

  // ---- Canvas setup ----
  useEffect(() => {
    const container = containerRef.current;
    const canvas    = canvasRef.current;
    const overlay   = overlayCanvasRef.current;
    if (!container || !canvas || !overlay) return;

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      canvas.width  = width;
      canvas.height = height;
      overlay.width = width;
      overlay.height = height;
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // Init engine after canvas has dimensions
    setTimeout(() => {
      physics.initEngine(canvas, skinObj);
      particles.startDust();
      sound?.startMusic?.();

      // Initial next ball
      setNextLevel(Math.ceil(Math.random() * MAX_NEXT_LEVEL) || 1);
    }, 50);

    return () => {
      ro.disconnect();
      physics.destroyEngine();
      sound?.stopMusic?.();
    };
  }, []);

  // ---- Particle overlay render loop ----
  useEffect(() => {
    let animId;
    function loop() {
      const canvas = overlayCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.drawFrame(ctx, canvas);
      animId = requestAnimationFrame(loop);
    }
    loop();
    return () => cancelAnimationFrame(animId);
  }, [particles]);

  // ---- Touch / Mouse input ----
  function getAimFromEvent(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    return Math.max(0, Math.min(canvas.width, clientX - rect.left));
  }

  function onPointerDown(e) {
    if (!canDrop || dropCooldown) return;
    sound?.unlockAudio?.();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const x = getAimFromEvent(e, canvas);
    aimXRef.current = x;
    setAimX(x);
    setIsDragging(true);
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const x = getAimFromEvent(e, canvas);
    aimXRef.current = x;
    setAimX(x);
  }

  function onPointerUp() {
    if (!isDragging || !canDrop || dropCooldown) return;
    setIsDragging(false);
    const canvas = canvasRef.current;
    if (!canvas || aimXRef.current === null) return;

    const x = aimXRef.current;
    const ballR = BALLS[nextLevel - 1].radius;
    const clampedX = Math.max(ballR + 2, Math.min(canvas.width - ballR - 2, x));

    physics.dropBall(clampedX, nextLevel);
    sound?.playDrop?.();
    sound?.haptic?.([15]);

    // Cooldown before next drop
    setDropCooldown(true);
    setTimeout(() => setDropCooldown(false), 500);

    // Generate next ball
    setNextLevel(Math.ceil(Math.random() * MAX_NEXT_LEVEL) || 1);
    setAimX(null);
    aimXRef.current = null;
  }

  // ---- Power-ups ----
  function handlePowerup(id) {
    if ((powerupUses[id] || 0) <= 0) {
      onShop?.(id);
      return;
    }
    const used = consumePowerup(id);
    if (!used) return;
    setPowerupUses(getPowerupUses());
    sound?.playPowerup?.();
    sound?.haptic?.([50]);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    if (id === 'bomb') {
      physics.activateBomb(cx, cy, 120);
      particles.spawnExplosion(cx, cy);
    } else if (id === 'change') {
      physics.activateChange(1, Math.min(3, BALLS.length));
    } else if (id === 'remove') {
      physics.activateRemoveSame(1);
    }
  }

  const nextBall = BALLS[nextLevel - 1];
  const comboMultipliers = [1, 1.5, 2, 3, 4, 5, 6, 8];
  const currentMult = comboMultipliers[Math.min(combo, 7)];

  return (
    <motion.div
      className="relative w-full h-full flex flex-col"
      animate={shake ? { x: [0, -8, 8, -5, 5, 0] } : {}}
      transition={{ duration: 0.3 }}
    >
      {/* HUD — top */}
      <div className="flex items-center justify-between px-4 py-2 bg-game-bg/80 backdrop-blur-sm border-b border-game-border z-10">
        {/* Score */}
        <div className="text-center">
          <div className="text-white/50 font-game text-xs uppercase">Score</div>
          <motion.div
            key={score}
            className="text-neon-cyan font-game font-bold text-xl"
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
          >
            {score.toLocaleString()}
          </motion.div>
        </div>

        {/* Combo */}
        <AnimatePresence>
          {combo > 1 && (
            <motion.div
              className="px-3 py-1 rounded-full bg-neon-pink/20 border border-neon-pink"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              <span className="font-arcade text-neon-pink text-xs">{currentMult}x COMBO!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Next ball preview */}
        <div className="flex flex-col items-center">
          <div className="text-white/50 font-game text-xs uppercase">Next</div>
          <motion.div
            key={nextLevel}
            className="rounded-full flex items-center justify-center"
            style={{
              width: 36, height: 36,
              background: `radial-gradient(circle at 35% 35%, ${nextBall?.gradient[0]}, ${nextBall?.gradient[1]})`,
              boxShadow: `0 0 12px ${nextBall?.glowColor}`,
              fontSize: 18,
            }}
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {nextBall?.emoji}
          </motion.div>
        </div>
      </div>

      {/* Arena canvas container */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden cursor-crosshair touch-none"
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
      >
        {/* Physics canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        {/* Particle overlay */}
        <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Aim line indicator */}
        {isDragging && aimX !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 pointer-events-none z-20"
            style={{
              left: aimX,
              background: 'linear-gradient(to bottom, rgba(0,245,255,0.8), transparent)',
            }}
          >
            {/* Preview ball at top of aim line */}
            <motion.div
              className="absolute -top-1 -translate-x-1/2 rounded-full flex items-center justify-center"
              style={{
                width: nextBall.radius * 1.2,
                height: nextBall.radius * 1.2,
                background: `radial-gradient(circle at 35% 35%, ${nextBall.gradient[0]}, ${nextBall.gradient[1]})`,
                boxShadow: `0 0 15px ${nextBall.glowColor}`,
                fontSize: nextBall.radius * 0.6,
              }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {nextBall.emoji}
            </motion.div>
          </div>
        )}

        {/* Score popups */}
        <AnimatePresence>
          {popups.map(popup => (
            <motion.div
              key={popup.id}
              className={`absolute pointer-events-none font-arcade text-sm z-30 ${
                popup.combo ? 'text-neon-gold' : 'text-neon-cyan'
              }`}
              style={{ left: popup.x - 20, top: popup.y - 20 }}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -50, scale: popup.combo ? 1.5 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            >
              {popup.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Power-ups bar */}
      <div className="flex items-center justify-around px-4 py-3 bg-game-bg/90 backdrop-blur-sm border-t border-game-border">
        {POWERUPS.map(pu => {
          const uses = powerupUses[pu.id] || 0;
          return (
            <motion.button
              key={pu.id}
              className="flex flex-col items-center gap-1 py-2 px-4 rounded-xl border transition-colors"
              style={{
                borderColor: uses > 0 ? pu.color : 'rgba(255,255,255,0.1)',
                background: uses > 0 ? `${pu.color}20` : 'transparent',
              }}
              onClick={() => handlePowerup(pu.id)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
            >
              <span className="text-2xl">{pu.emoji}</span>
              <span className="font-game text-xs text-white/70">{pu.name}</span>
              <span className={`font-arcade text-xs ${uses > 0 ? 'text-neon-cyan' : 'text-white/30'}`}>
                {uses > 0 ? `x${uses}` : 'π'}
              </span>
            </motion.button>
          );
        })}

        {/* Pi button */}
        <motion.button
          className="flex flex-col items-center gap-1 py-2 px-4 rounded-xl border border-neon-gold/50 bg-neon-gold/10"
          onClick={() => onShop?.()}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
        >
          <span className="text-2xl">π</span>
          <span className="font-game text-xs text-neon-gold">Shop</span>
          <span className="font-arcade text-xs text-neon-gold/60">0.5π</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
