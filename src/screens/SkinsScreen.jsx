// ============================================================
// SKINS SCREEN
// ============================================================
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SKINS, BALLS } from '../constants/gameConstants';
import { getActiveSkin, setActiveSkin, getUnlockedSkins, unlockSkin, getTotalScore } from '../utils/storage';

export default function SkinsScreen({ onBack, sound }) {
  const [activeSkin, setActive]     = useState(getActiveSkin());
  const [unlockedSkins, setUnlocked] = useState(getUnlockedSkins());
  const [totalScore, setTotalScore]  = useState(getTotalScore());
  const [toast, setToast]            = useState(null);

  useEffect(() => {
    const ts = getTotalScore();
    setTotalScore(ts);
    // Auto-unlock based on lifetime score
    SKINS.forEach(skin => {
      if (!skin.locked) return;
      if (ts >= skin.unlockScore) {
        unlockSkin(skin.id);
      }
    });
    setUnlocked(getUnlockedSkins());
  }, []);

  function selectSkin(skinId) {
    const skin = SKINS.find(s => s.id === skinId);
    if (!skin) return;
    const isUnlocked = unlockedSkins.includes(skinId);
    if (!isUnlocked) {
      showToast(`Need ${skin.unlockScore.toLocaleString()} lifetime score to unlock!`);
      sound?.playClick?.();
      return;
    }
    setActiveSkin(skinId);
    setActive(skinId);
    sound?.playClick?.();
    showToast(`${skin.name} equipped! ✅`);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  return (
    <motion.div
      className="flex flex-col h-full w-full"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0, transition: { duration: 0.35 } }}
      exit={{ opacity: 0, x: 100, transition: { duration: 0.25 } }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-4 border-b border-game-border">
        <motion.button
          className="w-10 h-10 rounded-full bg-game-card border border-game-border flex items-center justify-center text-xl"
          onClick={() => { sound?.playClick?.(); onBack(); }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ←
        </motion.button>
        <h1 className="font-arcade text-sm text-neon-cyan">SKINS</h1>
        <div className="ml-auto text-white/50 font-game text-sm">
          🏆 {totalScore.toLocaleString()} pts
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-3 bg-game-panel/50">
        <div className="text-white/40 font-game text-xs mb-2">Unlock progress (lifetime score)</div>
        <div className="relative w-full h-2 bg-white/10 rounded-full overflow-hidden">
          {SKINS.filter(s => s.locked).map((skin, i, arr) => {
            const nextThreshold = arr[i]?.unlockScore || 0;
            const progress = Math.min(100, (totalScore / (SKINS[SKINS.length - 1].unlockScore)) * 100);
            return null;
          })}
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #00f5ff, #8b00ff)' }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (totalScore / 10000) * 100)}%` }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
      </div>

      {/* Skins grid */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          {SKINS.map(skin => {
            const isUnlocked = unlockedSkins.includes(skin.id);
            const isActive   = activeSkin === skin.id;
            const progress   = isUnlocked ? 100 : Math.min(100, (totalScore / skin.unlockScore) * 100);

            return (
              <motion.div
                key={skin.id}
                className={`relative rounded-2xl border-2 p-4 cursor-pointer transition-colors ${
                  isActive
                    ? 'border-neon-cyan bg-neon-cyan/10'
                    : isUnlocked
                    ? 'border-game-border bg-game-card hover:border-white/40'
                    : 'border-game-border bg-game-card opacity-75'
                }`}
                onClick={() => selectSkin(skin.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {/* Active badge */}
                {isActive && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-neon-cyan rounded-full flex items-center justify-center text-xs font-bold text-game-bg">
                    ✓
                  </div>
                )}

                {/* Lock overlay */}
                {!isUnlocked && (
                  <div className="absolute inset-0 rounded-2xl bg-game-bg/40 flex items-center justify-center z-10">
                    <div className="text-2xl">🔒</div>
                  </div>
                )}

                {/* Skin preview */}
                <div className="flex justify-center gap-1 mb-3">
                  {BALLS.slice(0, 4).map((ball, i) => {
                    const ballColor = (skin.colors && isUnlocked)
                      ? skin.colors[i] || ball.gradient[0]
                      : ball.gradient[0];
                    const glowC = (skin.glow && isUnlocked) ? skin.glow : ball.glowColor;
                    return (
                      <div
                        key={ball.level}
                        className="rounded-full flex items-center justify-center"
                        style={{
                          width: 18 + i * 3,
                          height: 18 + i * 3,
                          background: `radial-gradient(circle at 35% 35%, ${ballColor}, rgba(0,0,0,0.4))`,
                          boxShadow: `0 0 8px ${glowC}`,
                          fontSize: 8 + i * 2,
                        }}
                      >
                        {ball.emoji}
                      </div>
                    );
                  })}
                </div>

                {/* Name & info */}
                <div className="font-game font-semibold text-white text-sm">{skin.name}</div>
                <div className="font-game text-white/50 text-xs mt-1">{skin.description}</div>

                {/* Unlock requirement */}
                {!isUnlocked && (
                  <div className="mt-2">
                    <div className="font-game text-xs text-neon-gold/70 mb-1">
                      🏆 {skin.unlockScore.toLocaleString()} pts
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-neon-gold"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  </div>
                )}

                {isUnlocked && !isActive && (
                  <div className="mt-2 font-game text-xs text-neon-cyan/70">Tap to equip</div>
                )}
                {isActive && (
                  <div className="mt-2 font-game text-xs text-neon-cyan font-bold">✅ Equipped</div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-game-panel border border-game-border text-white font-game text-sm px-5 py-3 rounded-2xl z-50 max-w-xs text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
