# 🎮 Bally Pi

> AAA-quality mobile-first physics puzzle game built with React + Vite + Matter.js + Pi Network

---

## 🚀 Quick Start

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # outputs dist/ folder
npm run preview   # preview production build
```

---

## 📁 Project Structure

```
bally-pi/
├── index.html                    # Entry + Pi SDK script + loading screen
├── package.json                  # Dependencies
├── vite.config.js                # Vite + code splitting (4 chunks)
├── tailwind.config.js            # Neon/arcade design system
├── postcss.config.js
├── netlify.toml                  # Netlify build + SPA redirect + cache headers
├── public/
│   ├── _redirects                # SPA fallback (Vite copies to dist/)
│   └── favicon.svg               # SVG neon ball icon
├── .gitignore
├── .eslintrc.cjs
└── src/
    ├── main.jsx                  # React DOM root
    ├── App.jsx                   # useReducer global state + screen router
    ├── index.css                 # Tailwind base + glassmorphism + neon utilities
    ├── constants/
    │   └── gameConstants.js      # 9 balls, 6 skins, 3 powerups, physics config
    ├── hooks/
    │   ├── usePhysicsEngine.js   # Matter.js: engine, walls, drop, merge, powerups
    │   ├── useParticles.js       # Canvas: sparks, rings, confetti, dust, stars
    │   ├── useSound.js           # Web Audio API: procedural 8-bit SFX + music
    │   └── usePiNetwork.js       # Pi SDK: createPayment → approval → completion
    ├── screens/
    │   ├── HomeScreen.jsx        # Menu + ball preview + settings + daily reward
    │   ├── GameScreen.jsx        # Physics arena + HUD + aim line + powerups bar
    │   ├── GameOverScreen.jsx    # Score + high score + share + retry
    │   └── SkinsScreen.jsx       # 6 skin packs + unlock progress
    ├── components/
    │   └── ShopPopup.jsx         # Pi payment UI (bottom sheet)
    └── utils/
        ├── storage.js            # LocalStorage: scores, skins, powerups, txids
        └── colors.js             # Color utilities
```

---

## ✅ Implemented Features

### 🎮 Gameplay
| Feature | Status |
|---------|--------|
| 9-level ball progression (🏓→⚽) | ✅ Complete |
| Real Matter.js physics (gravity/bounce/friction) | ✅ Complete |
| Touch/mouse aim + drop | ✅ Complete |
| Merge on collision (same level → next level) | ✅ Complete |
| Score system | ✅ Complete |
| Combo multiplier (up to 8×) | ✅ Complete |
| Danger zone game-over detection | ✅ Complete |
| Body limit (max 40) for performance | ✅ Complete |
| Body sleeping for performance | ✅ Complete |
| Double-merge prevention | ✅ Complete |

### 💥 Visual Effects
| Feature | Status |
|---------|--------|
| Canvas particle system | ✅ Complete |
| Merge burst (sparks + rings + stars) | ✅ Complete |
| Confetti for level 6+ merges | ✅ Complete |
| Screen shake on high-level merge | ✅ Complete |
| Radial gradient + glow on all balls | ✅ Complete |
| Sheen/highlight on ball surface | ✅ Complete |
| Floating ambient dust particles | ✅ Complete |
| Score pop animations (Framer Motion) | ✅ Complete |
| Aim line preview with ghost ball | ✅ Complete |

### 🔊 Sound System
| Feature | Status |
|---------|--------|
| Web Audio API procedural SFX | ✅ Complete |
| Drop / bounce / merge / explosion sounds | ✅ Complete |
| Pitch scales with ball level | ✅ Complete |
| 8-bit looping arcade music | ✅ Complete |
| Mobile audio unlock (first touch) | ✅ Complete |
| Toggle music / SFX / haptics | ✅ Complete |

### 🎨 UI / Screens
| Feature | Status |
|---------|--------|
| Home screen + animated title | ✅ Complete |
| Floating ball preview animation | ✅ Complete |
| Settings panel (music/sfx/haptics) | ✅ Complete |
| Daily reward button | ✅ Complete |
| Game screen HUD (score, next ball, combo) | ✅ Complete |
| Power-ups bar with stock counter | ✅ Complete |
| Game over screen + share | ✅ Complete |
| Skins screen + unlock progress | ✅ Complete |
| Shop popup (Pi payment) | ✅ Complete |
| Mobile-first (max-width 430px) | ✅ Complete |
| Safe area support (notch/home bar) | ✅ Complete |
| Framer Motion page transitions | ✅ Complete |

### 🎨 Skins System
| Skin | Unlock |
|------|--------|
| Classic | Always available |
| Neon 💜 | 500 pts lifetime |
| Fire 🔥 | 1,500 pts lifetime |
| Ice ❄️ | 3,000 pts lifetime |
| Gold 🪙 | 6,000 pts lifetime |
| Galaxy 🌌 | 10,000 pts lifetime |

### 💰 Pi Network
| Feature | Status |
|---------|--------|
| `Pi.createPayment()` | ✅ Implemented |
| `onReadyForServerApproval` | ✅ Implemented |
| `onReadyForServerCompletion` | ✅ Implemented |
| `onCancel` / `onError` | ✅ Implemented |
| `onIncompletePaymentFound` | ✅ Implemented |
| Anti-replay txid storage | ✅ Implemented |
| Reward gated behind server completion | ✅ Implemented |
| Backend endpoints | ⚠️ Simulated (see below) |

### 🔋 Power-ups
| Power-up | Cost | Effect |
|----------|------|--------|
| 💣 Bomb | 0.5 π | Remove nearby balls |
| 🔄 Change | 0.5 π | Change ball type |
| ❌ Remove | 0.5 π | Remove all same type |

---

## ⚠️ Production Checklist

### Before going live:

1. **Switch Pi SDK to production:**
   ```js
   // src/constants/gameConstants.js
   PI_CONFIG.sandbox = false   // was: true
   ```

2. **Implement real backend:**
   - `src/hooks/usePiNetwork.js` lines 14–30 contain `serverApprove` and `serverComplete`
   - Replace with real API calls:
   ```js
   // serverApprove
   await fetch('/api/pi/approve', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ paymentId })
   })

   // serverComplete
   await fetch('/api/pi/complete', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ paymentId, txid })
   })
   ```
   - Backend must call Pi Platform API:
     - `POST https://api.minepi.com/v2/payments/{id}/approve`
     - `POST https://api.minepi.com/v2/payments/{id}/complete`

3. **Environment variables:**
   ```
   VITE_PI_API_KEY=your_pi_server_api_key
   VITE_BACKEND_URL=https://your-backend.com
   ```

---

## 🚀 Deploy to Netlify

```bash
npm run build
# Upload dist/ folder to Netlify
# OR connect GitHub repo
```

`netlify.toml` already handles:
- Build command: `npm run build`
- Publish directory: `dist`
- SPA redirect: all `/*` → `/index.html` with 200
- Asset caching: 1 year immutable for `/assets/*`

---

## 📊 Data Storage (LocalStorage)

| Key | Type | Description |
|-----|------|-------------|
| `ballypi_highscore` | number | All-time best score |
| `ballypi_totalscore` | number | Cumulative lifetime score |
| `ballypi_skin` | string | Active skin ID |
| `ballypi_unlocked_skins` | JSON array | Unlocked skin IDs |
| `ballypi_powerups` | JSON object | `{bomb, change, remove}` use counts |
| `ballypi_txids` | JSON array | Pi transaction IDs (anti-replay, last 200) |
| `ballypi_daily` | timestamp | Last daily reward claim time |
| `ballypi_settings` | JSON object | `{music, sfx, haptics}` toggles |

---

## 🧠 Architecture Notes

### Physics Engine
- Matter.js Runner synchronized with `requestAnimationFrame` (delta = 1000/60)
- Custom draw loop on Canvas (no Matter.js Render — avoids conflicts)
- Body sleeping enabled for performance
- Max 40 physics bodies enforced (removes oldest small ball)
- Merge via `collisionStart` event with double-merge protection

### Sound System
- Pure Web Audio API procedural generation (no audio files required)
- Frequency and timbre scale with ball level
- Mobile audio context unlocked on first user touch

### Pi Payments
- Full 3-phase flow: createPayment → server approve → blockchain tx → server complete
- Reward is ONLY granted after confirmed `serverComplete` response
- txid stored in localStorage before reward grant (prevent race condition)
- Handles incomplete/concurrent payments via `onIncompletePaymentFound`

---

## 🏆 Planned / Future Features

- [ ] Real Pi backend (Node.js/Python server)
- [ ] Global leaderboard (Pi username)
- [ ] Daily missions system
- [ ] Ball trail effects
- [ ] Dynamic difficulty scaling
- [ ] More skin packs (unlockable via Pi)
- [ ] Progressive Web App (offline play)
- [ ] Rewarded ads (Pi Ads SDK)

---

## 📱 Mobile Compatibility

- Tested layouts: 320px → 430px width
- Touch events: touchstart/touchmove/touchend
- Safe area support via CSS env() variables
- 60 FPS target (body sleeping + object limit optimization)
- No zoom / user-scalable=no enforced

---

*Built with ❤️ for the Pi Network ecosystem*
