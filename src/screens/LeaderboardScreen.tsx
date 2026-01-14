import React from 'react';

import { useLeaderboard } from '../hooks/useLeaderboard';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../stores/gameStore';

const LeaderboardScreen: React.FC = () => {
    const { scores, loading, error } = useLeaderboard();
    const { t } = useTranslation();

    return (
        <div style={{ 
            height: '100dvh', 
            backgroundColor: '#222', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            padding: '20px',
            color: 'white',
            fontFamily: '"Press Start 2P", monospace'
        }}>
            <h1 style={{ color: '#ffeb3b', marginBottom: '30px' }}>{t('leaderboard.title')}</h1>
            
            <div style={{ 
                width: '100%', 
                maxWidth: '600px',
                flex: 1,
                minHeight: 0, 
                backgroundColor: '#333', 
                borderRadius: '10px', 
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                marginBottom: '20px',
                border: '4px solid #fff'
            }}>
                {loading && <p style={{ textAlign: 'center' }}>{t('leaderboard.loading')}</p>}
                {error && <p style={{ color: 'red', textAlign: 'center' }}>Error: {error}</p>}
                
                {!loading && !error && scores.length === 0 && (
                    <p style={{ textAlign: 'center' }}>{t('leaderboard.empty')}</p>
                )}

                <ul style={{ listStyle: 'none', padding: 0, overflowY: 'auto', flex: 1 }}>
                    {scores.map((entry, index) => (
                        <li key={entry.id} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            padding: '15px 0',
                            borderBottom: '1px dashed #555' 
                        }}>
                            <span style={{ color: index < 3 ? '#ffeb3b' : 'white' }}>
                                {index + 1}. {entry.player_name}
                            </span>
                            <span style={{ color: '#4CAF50' }}>{entry.score}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <button onClick={() => useGameStore.getState().setView('menu')} style={{ 
                    padding: '15px 40px', 
                    fontSize: '18px', 
                    cursor: 'pointer', 
                    backgroundColor: '#f44336', 
                    border: 'none', 
                    color: 'white', 
                    borderRadius: '8px',
                    fontFamily: '"Press Start 2P", monospace'
                }}>
                    {t('leaderboard.back')}
                </button>
        </div>
    );
};

export default LeaderboardScreen;
