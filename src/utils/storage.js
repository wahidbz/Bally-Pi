// ============================================================
// LOCAL STORAGE UTILITIES — Bally Pi
// ============================================================

const KEYS = {
  HIGH_SCORE:   'ballypi_highscore',
  TOTAL_SCORE:  'ballypi_totalscore',
  SKIN:         'ballypi_skin',
  UNLOCKED_SKINS: 'ballypi_unlocked_skins',
  POWERUPS:     'ballypi_powerups',
  TX_IDS:       'ballypi_txids',
  DAILY_REWARD: 'ballypi_daily',
  SETTINGS:     'ballypi_settings',
};

// --- Score ---
export function getHighScore() {
  return parseInt(localStorage.getItem(KEYS.HIGH_SCORE) || '0', 10);
}
export function saveHighScore(score) {
  const current = getHighScore();
  if (score > current) localStorage.setItem(KEYS.HIGH_SCORE, String(score));
}
export function getTotalScore() {
  return parseInt(localStorage.getItem(KEYS.TOTAL_SCORE) || '0', 10);
}
export function addToTotalScore(score) {
  const t = getTotalScore() + score;
  localStorage.setItem(KEYS.TOTAL_SCORE, String(t));
  return t;
}

// --- Skins ---
export function getActiveSkin() {
  return localStorage.getItem(KEYS.SKIN) || 'default';
}
export function setActiveSkin(skinId) {
  localStorage.setItem(KEYS.SKIN, skinId);
}
export function getUnlockedSkins() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.UNLOCKED_SKINS) || '["default"]');
  } catch {
    return ['default'];
  }
}
export function unlockSkin(skinId) {
  const unlocked = getUnlockedSkins();
  if (!unlocked.includes(skinId)) {
    unlocked.push(skinId);
    localStorage.setItem(KEYS.UNLOCKED_SKINS, JSON.stringify(unlocked));
  }
}

// --- Power-ups ---
export function getPowerupUses() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.POWERUPS) || '{"bomb":1,"change":1,"remove":1}');
  } catch {
    return { bomb: 1, change: 1, remove: 1 };
  }
}
export function savePowerupUses(uses) {
  localStorage.setItem(KEYS.POWERUPS, JSON.stringify(uses));
}
export function rechargePowerup(id) {
  const uses = getPowerupUses();
  uses[id] = (uses[id] || 0) + 1;
  savePowerupUses(uses);
  return uses;
}
export function consumePowerup(id) {
  const uses = getPowerupUses();
  if ((uses[id] || 0) > 0) {
    uses[id] -= 1;
    savePowerupUses(uses);
    return true;
  }
  return false;
}

// --- Pi Transaction Anti-Replay ---
export function hasTransaction(txid) {
  try {
    const ids = JSON.parse(localStorage.getItem(KEYS.TX_IDS) || '[]');
    return ids.includes(txid);
  } catch {
    return false;
  }
}
export function saveTransaction(txid) {
  try {
    const ids = JSON.parse(localStorage.getItem(KEYS.TX_IDS) || '[]');
    if (!ids.includes(txid)) {
      // Keep last 200 transaction IDs
      const updated = [...ids, txid].slice(-200);
      localStorage.setItem(KEYS.TX_IDS, JSON.stringify(updated));
    }
  } catch {
    localStorage.setItem(KEYS.TX_IDS, JSON.stringify([txid]));
  }
}

// --- Daily Reward ---
export function canClaimDailyReward(cooldown) {
  const last = parseInt(localStorage.getItem(KEYS.DAILY_REWARD) || '0', 10);
  return Date.now() - last >= cooldown;
}
export function claimDailyReward() {
  localStorage.setItem(KEYS.DAILY_REWARD, String(Date.now()));
}

// --- Settings ---
export function getSettings() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.SETTINGS) || '{"music":true,"sfx":true,"haptics":true}');
  } catch {
    return { music: true, sfx: true, haptics: true };
  }
}
export function saveSettings(settings) {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}
