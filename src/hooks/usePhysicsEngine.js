// ============================================================
// PHYSICS ENGINE HOOK — Matter.js
// Handles: gravity, walls, ball creation, merge, danger zone
// ============================================================
import { useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import { BALLS, PHYSICS_CONFIG } from '../constants/gameConstants';

const { Engine, Runner, Bodies, Body, World, Events, Composite } = Matter;

export function usePhysicsEngine({ canvasRef, onMerge, onGameOver, onBallAdded, activeSkin }) {
  const engineRef  = useRef(null);
  const runnerRef  = useRef(null);
  const worldRef   = useRef(null);
  const ballsRef   = useRef([]); // [{body, level}]
  const mergingRef = useRef(new Set()); // prevent double-merge
  const onMergeRef = useRef(onMerge);
  const onGameOverRef = useRef(onGameOver);
  const isRunningRef  = useRef(false);
  const animFrameRef  = useRef(null);

  // Keep callbacks fresh
  useEffect(() => { onMergeRef.current = onMerge; },     [onMerge]);
  useEffect(() => { onGameOverRef.current = onGameOver; }, [onGameOver]);

  // ---------- Draw a single ball on canvas ----------
  const drawBall = useCallback((ctx, body, ballData, skin) => {
    const { x, y } = body.position;
    const r = ballData.radius;
    const angle = body.angle;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Outer glow
    const glowColor = (skin && skin.glow) ? skin.glow : ballData.glowColor;
    ctx.shadowBlur  = 18 + ballData.level * 2;
    ctx.shadowColor = glowColor;

    // Gradient fill
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    const c1 = (skin && skin.colors) ? skin.colors[ballData.level - 1] : ballData.gradient[0];
    const c2 = (skin && skin.colors) ? skin.colors[ballData.level - 1] : ballData.gradient[1];
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Sheen highlight
    ctx.shadowBlur = 0;
    const sheen = ctx.createRadialGradient(-r * 0.35, -r * 0.35, 0, 0, 0, r);
    sheen.addColorStop(0, 'rgba(255,255,255,0.45)');
    sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
    sheen.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = sheen;
    ctx.fill();

    // Emoji label (for higher levels)
    if (r >= 30) {
      ctx.shadowBlur = 0;
      ctx.font       = `${Math.round(r * 0.7)}px serif`;
      ctx.textAlign  = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle  = 'rgba(0,0,0,0)'; // transparent - we use emoji
      // Actually draw the emoji
      ctx.font = `${Math.round(r * 0.8)}px serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.globalCompositeOperation = 'source-over';
      try { ctx.fillText(ballData.emoji, 0, 2); } catch(e) {}
    }

    ctx.restore();
  }, []);

  // ---------- Custom render loop ----------
  const renderLoop = useCallback((canvas, skin) => {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const dangerY = h * PHYSICS_CONFIG.dangerLineRatio;
    const engine  = engineRef.current;

    function draw() {
      if (!isRunningRef.current) return;
      animFrameRef.current = requestAnimationFrame(draw);

      // Clear
      ctx.clearRect(0, 0, w, h);

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#0a0014');
      bgGrad.addColorStop(1, '#12002a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Danger zone overlay
      ctx.fillStyle = 'rgba(255,0,0,0.06)';
      ctx.fillRect(0, 0, w, dangerY);

      // Danger line
      ctx.beginPath();
      ctx.moveTo(0, dangerY);
      ctx.lineTo(w, dangerY);
      ctx.strokeStyle = 'rgba(255,80,80,0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw balls
      const bodies = Composite.allBodies(engine.world);
      for (const bEntry of ballsRef.current) {
        if (!bEntry || !bEntry.body) continue;
        if (bEntry.body.isStatic) continue;
        const ballData = BALLS[bEntry.level - 1];
        if (ballData) drawBall(ctx, bEntry.body, ballData, skin);
      }

      // Wall glow edges
      ctx.shadowBlur = 0;
      // Left edge
      const leftGrad = ctx.createLinearGradient(0, 0, 6, 0);
      leftGrad.addColorStop(0, 'rgba(139,0,255,0.4)');
      leftGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = leftGrad;
      ctx.fillRect(0, 0, 6, h);
      // Right edge
      const rightGrad = ctx.createLinearGradient(w - 6, 0, w, 0);
      rightGrad.addColorStop(0, 'transparent');
      rightGrad.addColorStop(1, 'rgba(139,0,255,0.4)');
      ctx.fillStyle = rightGrad;
      ctx.fillRect(w - 6, 0, 6, h);
    }

    draw();
  }, [drawBall]);

  // ---------- Initialize engine ----------
  const initEngine = useCallback((canvas, skin) => {
    if (engineRef.current) return;

    const engine = Engine.create({
      gravity: PHYSICS_CONFIG.gravity,
      enableSleeping: true,
    });
    engine.positionIterations = 6;
    engine.velocityIterations = 4;
    engine.constraintIterations = 2;

    engineRef.current = engine;
    worldRef.current  = engine.world;

    const w = canvas.width;
    const h = canvas.height;
    const wt = PHYSICS_CONFIG.wallThickness;

    // Walls: bottom + sides (no top wall — open top)
    const floor = Bodies.rectangle(w / 2, h + wt / 2, w + wt * 2, wt, {
      isStatic: true, label: 'floor',
      friction: 0.3, restitution: 0.1,
    });
    const wallL = Bodies.rectangle(-wt / 2, h / 2, wt, h * 2, {
      isStatic: true, label: 'wallL',
      friction: 0.1, restitution: 0.2,
    });
    const wallR = Bodies.rectangle(w + wt / 2, h / 2, wt, h * 2, {
      isStatic: true, label: 'wallR',
      friction: 0.1, restitution: 0.2,
    });
    World.add(engine.world, [floor, wallL, wallR]);

    // Runner — synchronized with browser frame rate
    const runner = Runner.create({ delta: PHYSICS_CONFIG.engineTimestep });
    runnerRef.current = runner;
    Runner.run(runner, engine);

    // Collision events for merge detection
    Events.on(engine, 'collisionStart', (event) => {
      const pairs = event.pairs;
      const toMerge = [];

      for (const pair of pairs) {
        const { bodyA, bodyB } = pair;
        if (!bodyA || !bodyB) continue;
        if (bodyA.isStatic || bodyB.isStatic) continue;

        const entA = ballsRef.current.find(b => b && b.body === bodyA);
        const entB = ballsRef.current.find(b => b && b.body === bodyB);
        if (!entA || !entB) continue;
        if (entA.level !== entB.level) continue;
        if (entA.level >= BALLS.length) continue; // already max level

        const idA = bodyA.id;
        const idB = bodyB.id;
        const key = [Math.min(idA, idB), Math.max(idA, idB)].join('-');
        if (mergingRef.current.has(key)) continue;
        mergingRef.current.add(key);

        toMerge.push({ entA, entB });
      }

      // Process merges after loop to avoid mutation during iteration
      for (const { entA, entB } of toMerge) {
        const mergePos = {
          x: (entA.body.position.x + entB.body.position.x) / 2,
          y: (entA.body.position.y + entB.body.position.y) / 2,
        };
        const newLevel = entA.level + 1;
        const newBall  = BALLS[newLevel - 1];
        if (!newBall) continue;

        // Remove old bodies
        World.remove(engine.world, entA.body);
        World.remove(engine.world, entB.body);
        ballsRef.current = ballsRef.current.filter(b => b !== entA && b !== entB);

        // Spawn merged ball with slight upward velocity
        const newBody = Bodies.circle(mergePos.x, mergePos.y, newBall.radius, {
          restitution: PHYSICS_CONFIG.ballRestitution,
          friction:    PHYSICS_CONFIG.ballFriction,
          frictionAir: PHYSICS_CONFIG.ballFrictionAir,
          density:     PHYSICS_CONFIG.ballDensity,
          label:       `ball_${newLevel}`,
          sleepThreshold: PHYSICS_CONFIG.sleepThreshold,
        });
        Body.setVelocity(newBody, { x: 0, y: -4 });
        World.add(engine.world, newBody);
        ballsRef.current.push({ body: newBody, level: newLevel });

        // Callback: notify parent
        if (onMergeRef.current) {
          onMergeRef.current({
            level: newLevel,
            score: newBall.score,
            x: mergePos.x,
            y: mergePos.y,
          });
        }

        // Clean up merge lock after delay
        setTimeout(() => mergingRef.current.delete([
          Math.min(entA.body.id, entB.body.id),
          Math.max(entA.body.id, entB.body.id)
        ].join('-')), 300);
      }
    });

    // Game over check — every engine update
    Events.on(engine, 'afterUpdate', () => {
      if (!isRunningRef.current) return;
      const dangerY = canvas.height * PHYSICS_CONFIG.dangerLineRatio;
      for (const entry of ballsRef.current) {
        if (!entry || !entry.body) continue;
        if (entry.body.isStatic) continue;
        const { x, y } = entry.body.position;
        const r = BALLS[entry.level - 1]?.radius || 20;
        const vel = Math.abs(entry.body.velocity.y) + Math.abs(entry.body.velocity.x);
        // Ball top is above danger line AND it's nearly still
        if ((y - r) < dangerY && vel < 0.5) {
          isRunningRef.current = false;
          if (onGameOverRef.current) onGameOverRef.current();
          return;
        }
      }
    });

    isRunningRef.current = true;
    renderLoop(canvas, skin);
  }, [renderLoop]);

  // ---------- Drop a new ball ----------
  const dropBall = useCallback((x, level) => {
    const engine = engineRef.current;
    if (!engine || !isRunningRef.current) return;

    // Enforce body limit
    const bodyCount = ballsRef.current.length;
    if (bodyCount >= PHYSICS_CONFIG.maxBodies) {
      // Remove oldest small ball
      const smallest = ballsRef.current.reduce((min, b) => (!min || b.level < min.level) ? b : min, null);
      if (smallest) {
        World.remove(engine.world, smallest.body);
        ballsRef.current = ballsRef.current.filter(b => b !== smallest);
      }
    }

    const ballData = BALLS[level - 1];
    if (!ballData) return;

    const canvas = canvasRef.current;
    const spawnY = PHYSICS_CONFIG.dangerLineRatio * (canvas?.height || 700) - ballData.radius - 5;

    const body = Bodies.circle(x, spawnY, ballData.radius, {
      restitution: PHYSICS_CONFIG.ballRestitution,
      friction:    PHYSICS_CONFIG.ballFriction,
      frictionAir: PHYSICS_CONFIG.ballFrictionAir,
      density:     PHYSICS_CONFIG.ballDensity,
      label:       `ball_${level}`,
      sleepThreshold: PHYSICS_CONFIG.sleepThreshold,
    });
    Body.setVelocity(body, { x: 0, y: 2 });
    World.add(engine.world, body);
    ballsRef.current.push({ body, level });

    if (onBallAdded) onBallAdded();
  }, [canvasRef, onBallAdded]);

  // ---------- Power-up: Bomb ----------
  const activateBomb = useCallback((x, y, radius = 100) => {
    const engine = engineRef.current;
    if (!engine) return;
    const toRemove = ballsRef.current.filter(b => {
      if (!b || !b.body) return false;
      const dx = b.body.position.x - x;
      const dy = b.body.position.y - y;
      return Math.sqrt(dx * dx + dy * dy) < radius;
    });
    for (const b of toRemove) {
      World.remove(engine.world, b.body);
    }
    ballsRef.current = ballsRef.current.filter(b => !toRemove.includes(b));
    return toRemove.length;
  }, []);

  // ---------- Power-up: Change ----------
  const activateChange = useCallback((targetLevel, newLevel) => {
    const engine = engineRef.current;
    if (!engine) return;
    // Find first ball of targetLevel and change it
    const entry = ballsRef.current.find(b => b && b.level === targetLevel);
    if (!entry) return;
    entry.level = newLevel;
    // Resize by recreating body
    const newData = BALLS[newLevel - 1];
    const oldPos  = entry.body.position;
    const oldVel  = entry.body.velocity;
    World.remove(engine.world, entry.body);
    const newBody = Bodies.circle(oldPos.x, oldPos.y, newData.radius, {
      restitution: PHYSICS_CONFIG.ballRestitution,
      friction:    PHYSICS_CONFIG.ballFriction,
      frictionAir: PHYSICS_CONFIG.ballFrictionAir,
      density:     PHYSICS_CONFIG.ballDensity,
      label:       `ball_${newLevel}`,
      sleepThreshold: PHYSICS_CONFIG.sleepThreshold,
    });
    Body.setVelocity(newBody, oldVel);
    World.add(engine.world, newBody);
    entry.body = newBody;
  }, []);

  // ---------- Power-up: Remove Same Type ----------
  const activateRemoveSame = useCallback((level) => {
    const engine = engineRef.current;
    if (!engine) return;
    const toRemove = ballsRef.current.filter(b => b && b.level === level);
    for (const b of toRemove) World.remove(engine.world, b.body);
    ballsRef.current = ballsRef.current.filter(b => !toRemove.includes(b));
    return toRemove.length;
  }, []);

  // ---------- Reset ----------
  const resetEngine = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    isRunningRef.current = false;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    for (const b of ballsRef.current) {
      if (b && b.body) World.remove(engine.world, b.body);
    }
    ballsRef.current = [];
    mergingRef.current.clear();
    isRunningRef.current = true;

    const canvas = canvasRef.current;
    if (canvas) renderLoop(canvas, null);
  }, [canvasRef, renderLoop]);

  // ---------- Cleanup on unmount ----------
  const destroyEngine = useCallback(() => {
    isRunningRef.current = false;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (runnerRef.current) Runner.stop(runnerRef.current);
    if (engineRef.current) Engine.clear(engineRef.current);
    engineRef.current  = null;
    runnerRef.current  = null;
    ballsRef.current   = [];
    mergingRef.current.clear();
  }, []);

  return {
    initEngine,
    dropBall,
    resetEngine,
    destroyEngine,
    activateBomb,
    activateChange,
    activateRemoveSame,
    ballsRef,
    isRunningRef,
  };
}
