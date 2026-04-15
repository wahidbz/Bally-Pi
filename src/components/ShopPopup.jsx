// ============================================================
// SHOP POPUP — Pi payment UI
// ============================================================
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { POWERUPS, PI_CONFIG } from '../constants/gameConstants';
import { rechargePowerup, getPowerupUses } from '../utils/storage';

export default function ShopPopup({ onClose, piNetwork, sound, onRechargeSuccess }) {
  const [loading, setLoading]   = useState(null); // powerup id being purchased
  const [toast, setToast]       = useState(null);
  const [powerupUses, setPowerupUses] = useState(getPowerupUses());

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleRecharge(powerupId) {
    if (loading) return;
    sound?.playClick?.();
    sound?.haptic?.([30]);

    if (!window.piSdkReady) {
      // Demo mode: grant 1 use without Pi payment
      showToast('⚠️ Pi Browser required. Demo: +1 use added!', 'warning');
      const updated = rechargePowerup(powerupId);
      setPowerupUses({ ...updated });
      onRechargeSuccess?.();
      return;
    }

    setLoading(powerupId);

    piNetwork.createRechargePayment(
      powerupId,
      // onSuccess
      ({ paymentId, txid }) => {
        setLoading(null);
        sound?.playPowerup?.();
        sound?.haptic?.([50, 20, 80]);
        const updated = rechargePowerup(powerupId);
        setPowerupUses({ ...updated });
        showToast(`✅ Recharged! +1 ${POWERUPS.find(p => p.id === powerupId)?.name}`);
        onRechargeSuccess?.();
      },
      // onFailure
      (err) => {
        setLoading(null);
        const msg = err?.message || 'Payment failed';
        if (msg.includes('cancelled')) {
          showToast('Payment cancelled.', 'info');
        } else {
          showToast(`❌ ${msg}`, 'error');
        }
      }
    );
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/75 flex items-end justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-sm bg-game-panel border-t-2 border-neon-purple rounded-t-3xl pb-safe"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mt-4 mb-5" />

        {/* Title */}
        <div className="px-6 mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-arcade text-sm text-neon-gold">π SHOP</h2>
            <p className="font-game text-white/50 text-xs mt-1">Recharge power-ups with Pi</p>
          </div>
          <motion.button
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 text-lg"
            onClick={onClose}
            whileTap={{ scale: 0.9 }}
          >
            ×
          </motion.button>
        </div>

        {/* Pi status */}
        <div className="mx-6 mb-4 px-4 py-2 rounded-xl bg-neon-gold/10 border border-neon-gold/30 flex items-center gap-2">
          <span className="text-neon-gold text-lg">π</span>
          <span className="font-game text-sm text-white/70">
            {window.piSdkReady ? 'Pi Browser detected' : 'Demo mode (no Pi Browser)'}
          </span>
          <div className={`ml-auto w-2 h-2 rounded-full ${window.piSdkReady ? 'bg-neon-green' : 'bg-yellow-400'}`} />
        </div>

        {/* Power-ups */}
        <div className="px-6 pb-8 flex flex-col gap-3">
          {POWERUPS.map(pu => {
            const uses = powerupUses[pu.id] || 0;
            const isLoading = loading === pu.id;
            return (
              <motion.div
                key={pu.id}
                className="flex items-center gap-4 p-4 rounded-2xl border"
                style={{ borderColor: `${pu.color}60`, background: `${pu.color}10` }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-3xl">{pu.emoji}</div>
                <div className="flex-1">
                  <div className="font-game font-semibold text-white">{pu.name}</div>
                  <div className="font-game text-white/50 text-xs">{pu.description}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-game text-xs text-white/40">Stock:</span>
                    <span
                      className="font-arcade text-xs"
                      style={{ color: uses > 0 ? pu.color : 'rgba(255,255,255,0.3)' }}
                    >
                      x{uses}
                    </span>
                  </div>
                </div>

                <motion.button
                  className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl font-game font-bold text-sm"
                  style={{
                    background: isLoading ? 'rgba(255,215,0,0.2)' : 'rgba(255,215,0,0.15)',
                    border: '1px solid rgba(255,215,0,0.5)',
                    color: '#ffd700',
                    minWidth: 64,
                  }}
                  onClick={() => handleRecharge(pu.id)}
                  disabled={!!loading}
                  whileHover={!loading ? { scale: 1.08 } : {}}
                  whileTap={!loading ? { scale: 0.93 } : {}}
                >
                  {isLoading ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                    >
                      ⏳
                    </motion.span>
                  ) : (
                    <>
                      <span>π</span>
                      <span className="text-xs">{PI_CONFIG.rechargeCost}</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl font-game text-sm z-50 max-w-xs text-center border ${
                toast.type === 'error'   ? 'bg-red-900/90 border-red-500 text-white'  :
                toast.type === 'warning' ? 'bg-yellow-900/90 border-yellow-500 text-white' :
                toast.type === 'info'    ? 'bg-blue-900/90 border-blue-400 text-white' :
                'bg-game-panel border-neon-cyan text-white'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
