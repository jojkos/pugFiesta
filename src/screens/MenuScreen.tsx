import React from 'react';

import { useTranslation } from 'react-i18next';
import { useGameStore } from '../stores/gameStore';

const MenuScreen: React.FC = () => {
    const { t, i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div style={{ 
            height: '100vh', 
            backgroundColor: '#222', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white',
            fontFamily: '"Press Start 2P", monospace'
        }}>
            {/* Language Switcher */}
            <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '10px' }}>
                <button 
                    onClick={() => useGameStore.getState().setMuted(!useGameStore.getState().isMuted)} 
                    style={{ 
                        cursor: 'pointer', 
                        padding: '5px 10px', 
                        fontFamily: 'inherit',
                        backgroundColor: useGameStore((state) => state.isMuted) ? '#f44336' : '#2196F3',
                        color: 'white',
                        border: '2px solid white',
                        borderRadius: '5px'
                    }}
                >
                    {useGameStore((state) => state.isMuted) ? "UNMUTE" : "MUTE"}
                </button>
                <div style={{ width: '1px', backgroundColor: '#555', margin: '0 5px' }}></div>
                <button onClick={() => changeLanguage('en')} style={{ cursor: 'pointer', padding: '5px 10px', fontWeight: i18n.language === 'en' ? 'bold' : 'normal', background: 'none', border: '1px solid #555', color: 'white' }}>EN</button>
                <button onClick={() => changeLanguage('cz')} style={{ cursor: 'pointer', padding: '5px 10px', fontWeight: i18n.language === 'cz' ? 'bold' : 'normal', background: 'none', border: '1px solid #555', color: 'white' }}>CZ</button>
            </div>
            
            <h1 style={{ 
                color: '#ffeb3b', 
                fontSize: 'clamp(24px, 6vw, 40px)', 
                marginBottom: '10px', 
                textAlign: 'center',
                textShadow: '4px 4px 0px #000'
            }}>
                PUG BANGER FIESTA
            </h1>

            {/* Logo */}
            <div style={{ marginBottom: '30px', position: 'relative' }}>
                <img 
                    src="assets/images/logo.png" 
                    alt="Pug Fiesta" 
                    style={{ 
                        width: 'clamp(150px, 50vw, 300px)', 
                        imageRendering: 'pixelated',
                        animation: 'pulse 2s infinite ease-in-out'
                    }} 
                />
                <style>{`
                    @keyframes pulse {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                        100% { transform: scale(1); }
                    }
                `}</style>
            </div>

            {/* Dress Color Picker */}
            <div style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <label style={{ marginBottom: '10px', fontSize: '14px', color: '#FFF', textShadow: '2px 2px 0px #000' }}>
                   {t('menu.dressColor', 'DRESS COLOR')}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input 
                        type="color" 
                        value={useGameStore((state) => state.dressColor)}
                        onChange={(e) => useGameStore.getState().setDressColor(e.target.value)}
                        style={{ 
                            width: '60px', 
                            height: '40px', 
                            cursor: 'pointer', 
                            border: '2px solid white',
                            padding: 0,
                            backgroundColor: 'transparent'
                        }} 
                    />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '90%', maxWidth: '300px' }}>
                <button onClick={async () => {
                    // Start Audio Context on user interaction
                    try {
                        const Tone = await import('tone');
                        await Tone.start();
                        console.log('Audio Context Started');
                    } catch (e) {
                        console.error('Audio Start Error', e);
                    }
                    useGameStore.getState().setView('game');
                }} style={{ 
                    width: '100%',
                    padding: '15px', 
                    fontSize: 'clamp(18px, 5vw, 24px)', 
                    cursor: 'pointer', 
                    backgroundColor: '#4CAF50', 
                    border: '4px solid #fff', 
                    color: 'white', 
                    borderRadius: '10px',
                    fontFamily: 'inherit',
                    textShadow: '2px 2px 0px #000'
                }}>
                    {t('menu.play')}
                </button>

                <button onClick={() => useGameStore.getState().setView('leaderboard')} style={{ 
                    width: '100%',
                    padding: '15px', 
                    fontSize: '18px', 
                    cursor: 'pointer', 
                    backgroundColor: '#FF9800', 
                    border: '4px solid #fff', 
                    color: 'white', 
                    borderRadius: '10px',
                    fontFamily: 'inherit',
                    textShadow: '2px 2px 0px #000'
                }}>
                    {t('menu.leaderboard')}
                </button>

                <button onClick={() => useGameStore.getState().setView('instructions')} 
                    style={{ 
                        width: '100%',
                        padding: '15px', 
                        fontSize: '18px', 
                        cursor: 'pointer', 
                        backgroundColor: '#2196F3', 
                        border: '4px solid #fff', 
                        color: 'white', 
                        borderRadius: '10px',
                        fontFamily: 'inherit',
                        textShadow: '2px 2px 0px #000'
                    }}>
                    {t('menu.instructions')}
                </button>
            </div>
            
            {/* Buy Me A Coffee - Restored Original Style */}
            <a 
                href="https://buymeacoffee.com/jojkos" 
                target="_blank" 
                rel="noreferrer"
                style={{
                    position: 'absolute',
                    bottom: '15px',
                    left: '15px', // Original was left
                    zIndex: 210
                }}
            >
                <img 
                    src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" 
                    alt="Buy Me A Coffee" 
                    style={{
                        width: '180px',
                        height: 'auto',
                        borderRadius: '8px',
                        boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.5)'
                    }}
                />
            </a>
        </div>
    );
};

export default MenuScreen;
