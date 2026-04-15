// ============================================================
// GAME CONSTANTS — Bally Pi
// ============================================================

// Ball progression: 9 levels
export const BALLS = [
  {
    level: 1, name: 'Ping Pong', emoji: '🏓',
    radius: 18, score: 1,
    color: '#ffffff', glowColor: 'rgba(255,255,255,0.8)',
    gradient: ['#ffffff', '#cccccc'],
  },
  {
    level: 2, name: 'Tennis', emoji: '🎾',
    radius: 24, score: 3,
    color: '#c8e600', glowColor: 'rgba(200,230,0,0.8)',
    gradient: ['#c8e600', '#8ca000'],
  },
  {
    level: 3, name: 'Volleyball', emoji: '🏐',
    radius: 30, score: 6,
    color: '#4fc3f7', glowColor: 'rgba(79,195,247,0.8)',
    gradient: ['#4fc3f7', '#0288d1'],
  },
  {
    level: 4, name: 'Basketball', emoji: '🏀',
    radius: 38, score: 12,
    color: '#ff7043', glowColor: 'rgba(255,112,67,0.8)',
    gradient: ['#ff7043', '#bf360c'],
  },
  {
    level: 5, name: 'Baseball', emoji: '⚾',
    radius: 44, score: 20,
    color: '#f8f8f0', glowColor: 'rgba(248,248,240,0.8)',
    gradient: ['#f8f8f0', '#c8c8c0'],
  },
  {
    level: 6, name: 'Golf Ball', emoji: '⛳',
    radius: 50, score: 35,
    color: '#e0e0e0', glowColor: 'rgba(224,224,224,0.8)',
    gradient: ['#e0e0e0', '#9e9e9e'],
  },
  {
    level: 7, name: 'Bowling', emoji: '🎳',
    radius: 58, score: 55,
    color: '#ab47bc', glowColor: 'rgba(171,71,188,0.8)',
    gradient: ['#ab47bc', '#6a1a7c'],
  },
  {
    level: 8, name: 'Rugby', emoji: '🏉',
    radius: 66, score: 80,
    color: '#795548', glowColor: 'rgba(121,85,72,0.8)',
    gradient: ['#795548', '#4e342e'],
  },
  {
    level: 9, name: 'Football', emoji: '⚽',
    radius: 76, score: 120,
    color: '#ffffff', glowColor: 'rgba(255,255,255,0.9)',
    gradient: ['#ffffff', '#888888'],
    isFinal: true,
  },
];

// Skins system
export const SKINS = [
  {
    id: 'default',
    name: 'Classic',
    emoji: '⚽',
    description: 'The original look',
    unlockScore: 0,
    colors: null, // use default ball colors
    glow: null,
    locked: false,
  },
  {
    id: 'neon',
    name: 'Neon Pack',
    emoji: '💜',
    description: 'Electric neon vibes',
    unlockScore: 500,
    colors: ['#00f5ff','#00d4ff','#00b4d8','#0096c7','#0077b6','#023e8a','#ff00ff','#cc00ff','#9900ff'],
    glow: 'rgba(0,245,255,0.9)',
    locked: true,
  },
  {
    id: 'fire',
    name: 'Fire Pack 🔥',
    emoji: '🔥',
    description: 'Blazing hot flames',
    unlockScore: 1500,
    colors: ['#ff4500','#ff6d00','#ff8c00','#ffa000','#ffb300','#ffc400','#ff3d00','#dd2c00','#bf360c'],
    glow: 'rgba(255,69,0,0.9)',
    locked: true,
  },
  {
    id: 'ice',
    name: 'Ice Pack ❄️',
    emoji: '❄️',
    description: 'Arctic chill aesthetics',
    unlockScore: 3000,
    colors: ['#e0f7fa','#b2ebf2','#80deea','#4dd0e1','#26c6da','#00bcd4','#0097a7','#00838f','#006064'],
    glow: 'rgba(128,222,234,0.9)',
    locked: true,
  },
  {
    id: 'gold',
    name: 'Gold Pack 🪙',
    emoji: '🪙',
    description: 'Legendary golden touch',
    unlockScore: 6000,
    colors: ['#ffd700','#ffca28','#ffb300','#ffa000','#ff8f00','#ff6f00','#f9a825','#f57f17','#e65100'],
    glow: 'rgba(255,215,0,0.9)',
    locked: true,
  },
  {
    id: 'galaxy',
    name: 'Galaxy Pack 🌌',
    emoji: '🌌',
    description: 'Deep space cosmic balls',
    unlockScore: 10000,
    colors: ['#e040fb','#ce93d8','#ba68c8','#ab47bc','#9c27b0','#7b1fa2','#6a1b9a','#4a148c','#12005e'],
    glow: 'rgba(224,64,251,0.9)',
    locked: true,
  },
];

// Power-ups
export const POWERUPS = [
  {
    id: 'bomb',
    name: 'Bomb',
    emoji: '💣',
    description: 'Remove nearby balls',
    freeUses: 1,
    piCost: 0.5,
    color: '#ff4500',
  },
  {
    id: 'change',
    name: 'Change',
    emoji: '🔄',
    description: 'Change ball type',
    freeUses: 1,
    piCost: 0.5,
    color: '#00f5ff',
  },
  {
    id: 'remove',
    name: 'Remove',
    emoji: '❌',
    description: 'Remove all same type',
    freeUses: 1,
    piCost: 0.5,
    color: '#ff006e',
  },
];

// Physics configuration
export const PHYSICS_CONFIG = {
  gravity: { x: 0, y: 1.5 },
  wallThickness: 50,
  ballRestitution: 0.45,
  ballFriction: 0.01,
  ballFrictionAir: 0.008,
  ballDensity: 0.002,
  engineTimestep: 1000 / 60,
  maxBodies: 40,
  dangerLineRatio: 0.18, // top 18% = danger
  sleepThreshold: 60,
};

// Combo system
export const COMBO_CONFIG = {
  timeWindow: 2000, // ms between merges for combo
  multipliers: [1, 1.5, 2, 3, 4, 5, 6, 8],
};

// Pi payment config
export const PI_CONFIG = {
  sandbox: true, // set false for production
  rechargeCost: 0.5,
  paymentMemo: 'Bally Pi Power-up Recharge',
};

// Arena dimensions (responsive)
export const ARENA = {
  maxWidth: 430,
  topPadding: 80,
  bottomPadding: 90,
};

// Daily reward config
export const DAILY_REWARD = {
  cooldown: 24 * 60 * 60 * 1000, // 24 hours
  amount: 100, // score bonus
};
