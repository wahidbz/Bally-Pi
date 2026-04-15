// ============================================================
// HOME SCREEN
// ============================================================
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BALLS } from '../constants/gameConstants';
import { getHighScore, getTotalScore, getSettings, saveSettings, canClaimDailyReward, claimDailyReward } from '../utils/storage';
import { DAILY_REWARD as DR } from '../constants/gameConstants';

const pageAnim = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -40, transition: { duration: 0.25 } },
};

const btnAnim = {
  whileHover: { scale: 1.06, transition: { duration: 0.15 } },
  whileTap:   { scale: 0.95, transition: { duration: 0.1 } },
};

export default function HomeScreen({ onPlay, onSkins, onSettings, sound }) {
  const [highScore, setHighScore]     = useState(0);
  const [canClaim, setCanClaim]       = useState(false);
  const [claimed, setClaimed]         = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings]       = useState(getSettings());

  useEffect(() => {
    setHighScore(getHighScore());
    setCanClaim(canClaimDailyReward(DR.cooldown));
  }, []);

  function handleClaim() {
    if (!canClaim) return;
    claimDailyReward();
    setCanClaim(false);
    setClaimed(true);
    sound?.playClick?.();
    setTimeout(() => setClaimed(false), 2000);
  }

  function handleSettingToggle(key) {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    saveSettings(updated);
    sound?.playClick?.();
    if (key === 'music') sound?.toggleMusic?.(!settings[key]);
  }

  // Preview balls floating
  const previewBalls = BALLS.slice(0, 5);

  return (
    <motion.div
      className="flex flex-col items-center justify-between h-full w-full px-4 py-safe"
      variants={pageAnim}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Header */}
      <div className="w-full flex justify-between items-center pt-4">
        <motion.button
          className="w-10 h-10 rounded-full bg-game-card border border-game-border flex items-center justify-center text-xl"
          onClick={() => { sound?.playClick?.(); setShowSettings(s => !s); }}
          {...btnAnim}
        >⚙️</motion.button>

        <div className="text-center">
          <div className="text-neon-cyan font-arcade text-xs tracking-widest">BEST</div>
          <div className="text-white font-game font-bold text-2xl">{highScore.toLocaleString()}</div>
        </div>

        {/* Daily reward */}
        <motion.button
          className={`w-10 h-10 rounded-full border flex items-center justify-center text-xl ${
            canClaim ? 'bg-neon-gold/20 border-neon-gold animate-pulse' : 'bg-game-card border-game-border opacity-50'
          }`}
          onClick={handleClaim}
          disabled={!canClaim}
          {...btnAnim}
        >🎁</motion.button>
      </div>

      {/* Title */}
      <div className="flex flex-col items-center gap-2 mt-2">
        <motion.div
          className="font-arcade text-4xl"
          style={{ color: '#00f5ff', textShadow: '0 0 30px #00f5ff, 0 0 60px #8b00ff' }}
          animate={{ textShadow: ['0 0 30px #00f5ff', '0 0 50px #ff006e', '0 0 30px #00f5ff'] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          BALLY
        </motion.div>
        <motion.div
          className="font-arcade text-2xl"
          style={{ color: '#ffd700', textShadow: '0 0 20px #ffd700' }}
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          π Pi
        </motion.div>
        <div className="text-white/50 font-game text-sm mt-1">Merge • Physics • Earn</div>
      </div>

      {/* Floating preview balls */}
      <div className="flex gap-3 items-end my-4">
        {previewBalls.map((ball, i) => (
          <motion.div
            key={ball.level}
            className="rounded-full flex items-center justify-center text-base select-none"
            style={{
              width: ball.radius * 1.5,
              height: ball.radius * 1.5,
              background: `radial-gradient(circle at 35% 35%, ${ball.gradient[0]}, ${ball.gradient[1]})`,
              boxShadow: `0 0 ${10 + ball.level * 3}px ${ball.glowColor}`,
              fontSize: ball.radius * 0.7,
            }}
            animate={{ y: [0, -(6 + i * 3), 0] }}
            transition={{ duration: 1.5 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
          >
            {ball.emoji}
          </motion.div>
        ))}
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs mb-4">
        <motion.button
          className="w-full py-4 rounded-2xl font-arcade text-sm text-game-bg tracking-wider"
          style={{
            background: 'linear-gradient(135deg, #00f5ff, #8b00ff)',
            boxShadow: '0 0 30px rgba(0,245,255,0.5)',
          }}
          onClick={() => { sound?.playClick?.(); onPlay(); }}
          {...btnAnim}
        >
          ▶ PLAY NOW
        </motion.button>

        <div className="flex gap-3">
          <motion.button
            className="flex-1 py-3 rounded-xl border border-game-border bg-game-card font-game font-semibold text-white text-base"
            onClick={() => { sound?.playClick?.(); onSkins(); }}
            {...btnAnim}
          >
            🎨 Skins
          </motion.button>
          <motion.button
            className="flex-1 py-3 rounded-xl border border-game-border bg-game-card font-game font-semibold text-white text-base"
            onClick={() => { sound?.playClick?.(); setShowSettings(s => !s); }}
            {...btnAnim}
          >
            ⚙️ Settings
          </motion.button>
        </div>
      </div>

      {/* Daily reward claimed toast */}
      <AnimatePresence>
        {claimed && (
          <motion.div
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-neon-gold/90 text-black font-game font-bold px-6 py-3 rounded-2xl z-50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            🎁 +100 Daily Bonus!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex items-end justify-center z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              className="w-full max-w-sm bg-game-panel border-t border-game-border rounded-t-3xl p-6 pb-10"
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-6" />
              <h2 className="font-arcade text-sm text-neon-cyan mb-6 text-center">SETTINGS</h2>

              {[
                { key: 'music', label: 'Music 🎵' },
                { key: 'sfx',   label: 'Sound FX 🔊' },
                { key: 'haptics', label: 'Haptics 📳' },
              ].map(({ key, label }) => (
                <div key={key} className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="font-game text-white text-base">{label}</span>
                  <motion.button
                    className={`w-14 h-7 rounded-full relative transition-colors duration-200 ${
                      settings[key] ? 'bg-neon-cyan' : 'bg-white/20'
                    }`}
                    onClick={() => handleSettingToggle(key)}
                    {...btnAnim}
                  >
                    <motion.div
                      className="w-5 h-5 bg-white rounded-full absolute top-1"
                      animate={{ left: settings[key] ? '1.75rem' : '0.25rem' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                  </motion.button>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
