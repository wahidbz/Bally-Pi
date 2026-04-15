// ============================================================
// APP ROOT — Global state, screen routing, sound init
// ============================================================
import React, { useReducer, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import HomeScreen    from './screens/HomeScreen';
import GameScreen    from './screens/GameScreen';
import GameOverScreen from './screens/GameOverScreen';
import SkinsScreen   from './screens/SkinsScreen';
import ShopPopup     from './components/ShopPopup';
import { useSound }  from './hooks/useSound';
import { usePiNetwork } from './hooks/usePiNetwork';
import {
  getHighScore, saveHighScore, addToTotalScore,
  getActiveSkin, getSettings,
} from './utils/storage';

// ---- State machine ----
const initialState = {
  screen:      'home',    // home | game | gameover | skins
  score:       0,
  highScore:   getHighScore(),
  activeSkin:  getActiveSkin(),
  showShop:    false,
  shopTarget:  null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'PLAY':
      return { ...state, screen: 'game', score: 0, showShop: false };
    case 'GAME_OVER':
      return { ...state, screen: 'gameover' };
    case 'RETRY':
      return { ...state, screen: 'game', score: 0, showShop: false };
    case 'HOME':
      return { ...state, screen: 'home', showShop: false };
    case 'SKINS':
      return { ...state, screen: 'skins' };
    case 'SET_SCORE':
      return { ...state, score: action.score };
    case 'UPDATE_HIGH':
      return { ...state, highScore: action.highScore };
    case 'SET_SKIN':
      return { ...state, activeSkin: action.skinId };
    case 'OPEN_SHOP':
      return { ...state, showShop: true, shopTarget: action.target || null };
    case 'CLOSE_SHOP':
      return { ...state, showShop: false, shopTarget: null };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const settings = useRef(getSettings());
  const sound = useSound(settings.current);

  // Pi Network
  const piNetwork = usePiNetwork();

  // Update settings ref when toggled
  function handleSettingsChange(newSettings) {
    settings.current = newSettings;
  }

  // Authenticate Pi on mount
  useEffect(() => {
    if (window.piSdkReady) {
      piNetwork.authenticate().then(auth => {
        if (auth) console.log('[Pi] Authenticated:', auth.user?.username);
      });
    }

    // Init audio context on first user interaction
    const initAudio = () => {
      sound.unlockAudio();
      document.removeEventListener('touchstart', initAudio);
      document.removeEventListener('mousedown', initAudio);
    };
    document.addEventListener('touchstart', initAudio, { once: true, passive: true });
    document.addEventListener('mousedown', initAudio, { once: true });

    return () => {
      document.removeEventListener('touchstart', initAudio);
      document.removeEventListener('mousedown', initAudio);
    };
  }, []);

  // Score setter for GameScreen
  const setScore = useCallback((updater) => {
    dispatch({ type: 'SET_SCORE', score: typeof updater === 'function'
      ? updater(state.score)
      : updater
    });
  }, [state.score]);

  // On game over: save scores
  const handleGameOver = useCallback(() => {
    const finalScore = state.score;
    const prevHigh   = getHighScore();
    if (finalScore > prevHigh) {
      saveHighScore(finalScore);
      dispatch({ type: 'UPDATE_HIGH', highScore: finalScore });
    }
    addToTotalScore(finalScore);
    dispatch({ type: 'GAME_OVER' });
  }, [state.score]);

  return (
    <div
      className="relative w-full h-full flex items-center justify-center bg-game-bg overflow-hidden"
      style={{ background: '#0a0014' }}
    >
      {/* Centered game viewport — max 430px (mobile-first) */}
      <div
        className="relative w-full h-full overflow-hidden scanlines"
        style={{ maxWidth: 430 }}
      >
        {/* Ambient background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 40% at 50% 80%, rgba(139,0,255,0.12) 0%, transparent 70%)',
          }}
        />

        {/* Screen routing with AnimatePresence */}
        <AnimatePresence mode="wait">
          {state.screen === 'home' && (
            <motion.div key="home" className="absolute inset-0">
              <HomeScreen
                onPlay={() => { sound.playClick(); dispatch({ type: 'PLAY' }); }}
                onSkins={() => { sound.playClick(); dispatch({ type: 'SKINS' }); }}
                onSettings={() => {}}
                sound={sound}
              />
            </motion.div>
          )}

          {state.screen === 'game' && (
            <motion.div key="game" className="absolute inset-0">
              <GameScreen
                score={state.score}
                setScore={setScore}
                onGameOver={handleGameOver}
                sound={sound}
                onShop={(target) => dispatch({ type: 'OPEN_SHOP', target })}
                activeSkinId={state.activeSkin}
              />
            </motion.div>
          )}

          {state.screen === 'gameover' && (
            <motion.div key="gameover" className="absolute inset-0">
              <GameOverScreen
                score={state.score}
                onRetry={() => { sound.playClick(); dispatch({ type: 'RETRY' }); }}
                onHome={() => { sound.playClick(); dispatch({ type: 'HOME' }); }}
                sound={sound}
              />
            </motion.div>
          )}

          {state.screen === 'skins' && (
            <motion.div key="skins" className="absolute inset-0">
              <SkinsScreen
                onBack={() => { sound.playClick(); dispatch({ type: 'HOME' }); }}
                sound={sound}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shop popup (overlay, works on any screen) */}
        <AnimatePresence>
          {state.showShop && (
            <ShopPopup
              onClose={() => dispatch({ type: 'CLOSE_SHOP' })}
              piNetwork={piNetwork}
              sound={sound}
              onRechargeSuccess={() => dispatch({ type: 'CLOSE_SHOP' })}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
