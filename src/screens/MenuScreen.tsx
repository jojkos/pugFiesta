import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../stores/gameStore';

const DRESS_COLORS = [
    '#FFFFFF', '#F44336', '#E91E63', '#9C27B0', '#2196F3', 
    '#009688', '#4CAF50', '#FFEB3B', '#FF9800', '#795548', '#607D8B'
];

const MenuScreen: React.FC = () => {
    const { t, i18n } = useTranslation();
    const dressColor = useGameStore((state) => state.dressColor);
    const isMuted = useGameStore((state) => state.isMuted);
    const [showColorMenu, setShowColorMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowColorMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                    onClick={() => useGameStore.getState().setMuted(!isMuted)} 
                    style={{ 
                        cursor: 'pointer', 
                        padding: '5px 10px', 
                        fontFamily: 'inherit',
                        backgroundColor: isMuted ? '#f44336' : '#2196F3',
                        color: 'white',
                        border: '2px solid white',
                        borderRadius: '5px'
                    }}
                >
                    {isMuted ? "UNMUTE" : "MUTE"}
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
                        animation: 'pulse 2s infinite ease-in-out',
                        filter: dressColor ? `drop-shadow(0 0 15px ${dressColor})` : 'none',
                        transition: 'filter 0.3s ease'
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
                <div style={{ position: 'relative' }} ref={menuRef}>
                     {/* Trigger Button */}
                    <button 
                        onClick={() => setShowColorMenu(!showColorMenu)}
                        style={{
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '12px',
                            padding: '8px 16px',
                            backgroundColor: '#333',
                            border: '2px solid white',
                            borderRadius: '30px',
                            cursor: 'pointer',
                            color: 'white',
                            fontFamily: 'inherit',
                            fontSize: '14px'
                        }}
                    >
                        {dressColor ? (
                            <div style={{ 
                                width: '32px', 
                                height: '32px', 
                                borderRadius: '50%', 
                                backgroundColor: dressColor!, 
                                border: '2px solid white', 
                                boxShadow: '0 0 5px rgba(255,255,255,0.5)' 
                            }}></div>
                        ) : (
                             // Checkerboard for Transparent/None
                            <div style={{ 
                                width: '32px', 
                                height: '32px', 
                                borderRadius: '50%', 
                                border: '2px solid white',
                                backgroundColor: '#fff',
                                backgroundImage: `conic-gradient(#ccc 90deg, #fff 90deg 180deg, #ccc 180deg 270deg, #fff 270deg)`,
                                backgroundSize: '8px 8px',
                                backgroundPosition: 'center',
                                boxShadow: '0 0 5px rgba(255,255,255,0.3) inset'
                            }}></div>
                        )}
                        <span style={{ fontSize: '12px', transform: showColorMenu ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                    </button>

                    {/* Popover Menu */}
                    {showColorMenu && (
                        <div style={{
                            position: 'absolute',
                            bottom: '120%', // Above
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: '#222',
                            border: '2px solid white',
                            borderRadius: '10px',
                            padding: '15px',
                            width: '260px',
                            zIndex: 100,
                            boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '15px'
                        }}>
                             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                                 {DRESS_COLORS.map(color => (
                                     <button 
                                        key={color}
                                        onClick={() => { useGameStore.getState().setDressColor(color); setShowColorMenu(false); }}
                                        style={{
                                            width: '25px', height: '25px', borderRadius: '50%', 
                                            backgroundColor: color, cursor: 'pointer',
                                            border: dressColor === color ? '2px solid white' : '1px solid #555',
                                            boxShadow: dressColor === color ? '0 0 5px white' : 'none',
                                            padding: 0,
                                        }}
                                     />
                                 ))}
                             </div>
                             
                             <div style={{ width: '100%', height: '1px', backgroundColor: '#444' }}></div>

                             <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                 {/* Custom Color Button */}
                                 <div style={{ position: 'relative', width: '100px', height: '35px' }}>
                                     <input 
                                        type="color" 
                                        onChange={(e) => { useGameStore.getState().setDressColor(e.target.value); setShowColorMenu(false); }}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 2 }}
                                     />
                                     <div style={{ 
                                         position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                                         background: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)',
                                         borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                         fontSize: '10px', color: 'white', textShadow: '0 0 2px black', fontWeight: 'bold', border: '1px solid #fff'
                                     }}>
                                         {t('menu.colorCustom')}
                                     </div>
                                 </div>
                                 
                                 {/* None Button */}
                                 <button
                                    onClick={() => { useGameStore.getState().setDressColor(null); setShowColorMenu(false); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                        padding: '0 10px', backgroundColor: '#333', color: 'white',
                                        border: '1px solid #777', borderRadius: '5px', cursor: 'pointer',
                                        fontFamily: 'inherit', fontSize: '10px', height: '35px',
                                        minWidth: '100px'
                                    }}
                                 >
                                     🚫 {t('menu.colorNone')}
                                 </button>
                             </div>
                        </div>
                    )}
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
                        width: 'clamp(120px, 30vw, 180px)',
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
