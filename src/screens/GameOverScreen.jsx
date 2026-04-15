// ============================================================
// GAME OVER SCREEN
// ============================================================
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getHighScore, saveHighScore, getTotalScore } from '../utils/storage';
import { BALLS } from '../constants/gameConstants';

export default function GameOverScreen({ score, onRetry, onHome, sound }) {
  const [highScore, setHighScore] = useState(0);
  const [isNew, setIsNew]         = useState(false);
  const [show, setShow]           = useState(false);

  useEffect(() => {
    const prev = getHighScore();
    if (score > prev) {
      saveHighScore(score);
      setIsNew(true);
    }
    setHighScore(Math.max(score, prev));

    sound?.playGameOver?.();
    setTimeout(() => setShow(true), 100);
  }, []);

  function handleShare() {
    const text = `🎮 I scored ${score.toLocaleString()} in Bally Pi! Can you beat me? #BallyPi #PiNetwork`;
    if (navigator.share) {
      navigator.share({ title: 'Bally Pi', text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).then(() => alert('Score copied to clipboard!'));
    }
    sound?.playClick?.();
  }

  const totalScore = getTotalScore();

  // Milestone messages
  let message = 'Keep merging! 🎯';
  if (score >= 10000) message = 'LEGENDARY! 🏆';
  else if (score >= 5000) message = 'Amazing! 🔥';
  else if (score >= 2000) message = 'Great run! ⭐';
  else if (score >= 1000) message = 'Nice work! 💪';

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full w-full px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background pulse */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 40%, rgba(139,0,255,0.15) 0%, transparent 70%)' }}
      />

      <AnimatePresence>
        {show && (
          <motion.div
            className="flex flex-col items-center gap-6 w-full max-w-xs"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          >
            {/* Game Over title */}
            <motion.div
              className="font-arcade text-2xl text-center"
              style={{ color: '#ff006e', textShadow: '0 0 30px #ff006e' }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              GAME OVER
            </motion.div>

            <div className="font-game text-white/70 text-base">{message}</div>

            {/* Score card */}
            <div className="w-full bg-game-card border border-game-border rounded-3xl p-6 flex flex-col gap-4">
              {/* Current score */}
              <div className="text-center">
                <div className="text-white/50 font-game text-sm uppercase tracking-wider">Score</div>
                <motion.div
                  className="font-arcade text-4xl mt-1"
                  style={{ color: '#00f5ff', textShadow: '0 0 20px #00f5ff' }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                >
                  {score.toLocaleString()}
                </motion.div>
              </div>

              <div className="h-px bg-white/10" />

              {/* Best score */}
              <div className="flex justify-between items-center">
                <span className="font-game text-white/60 text-sm">Best</span>
                <div className="flex items-center gap-2">
                  {isNew && (
                    <motion.span
                      className="font-game text-xs text-neon-gold px-2 py-0.5 rounded-full border border-neon-gold/50 bg-neon-gold/10"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      NEW! 🏆
                    </motion.span>
                  )}
                  <span className="font-game font-bold text-white">{highScore.toLocaleString()}</span>
                </div>
              </div>

              {/* Total score (lifetime) */}
              <div className="flex justify-between items-center">
                <span className="font-game text-white/60 text-sm">Lifetime</span>
                <span className="font-game text-white/80">{totalScore.toLocaleString()}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 w-full">
              <motion.button
                className="w-full py-4 rounded-2xl font-arcade text-sm text-game-bg tracking-wider"
                style={{
                  background: 'linear-gradient(135deg, #00f5ff, #8b00ff)',
                  boxShadow: '0 0 25px rgba(0,245,255,0.4)',
                }}
                onClick={() => { sound?.playClick?.(); onRetry(); }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🔄 PLAY AGAIN
              </motion.button>

              <div className="flex gap-3">
                <motion.button
                  className="flex-1 py-3 rounded-xl border border-game-border bg-game-card font-game font-semibold text-white text-base"
                  onClick={() => { sound?.playClick?.(); handleShare(); }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  📤 Share
                </motion.button>
                <motion.button
                  className="flex-1 py-3 rounded-xl border border-game-border bg-game-card font-game font-semibold text-white text-base"
                  onClick={() => { sound?.playClick?.(); onHome(); }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🏠 Home
                </motion.button>
              </div>
            </div>

            {/* Ball progression guide */}
            <div className="w-full">
              <div className="text-white/40 font-game text-xs text-center mb-3">Ball Progression</div>
              <div className="flex justify-around">
                {BALLS.map(b => (
                  <div key={b.level} className="flex flex-col items-center gap-1">
                    <div
                      className="rounded-full flex items-center justify-center"
                      style={{
                        width: 20, height: 20,
                        background: `radial-gradient(circle at 35% 35%, ${b.gradient[0]}, ${b.gradient[1]})`,
                        boxShadow: `0 0 6px ${b.glowColor}`,
                        fontSize: 10,
                      }}
                    >
                      {b.emoji}
                    </div>
                    <span className="font-game text-white/30 text-xs">{b.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
