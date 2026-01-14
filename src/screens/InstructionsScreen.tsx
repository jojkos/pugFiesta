import React from 'react';

import { useTranslation } from 'react-i18next';
import { useGameStore } from '../stores/gameStore';

const InstructionsScreen: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div style={{ 
            height: '100vh', 
            backgroundColor: '#222', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white',
            fontFamily: '"Press Start 2P", monospace',
            padding: '20px',
            textAlign: 'center'
        }}>
            <h1 style={{ color: '#2196F3', marginBottom: '40px' }}>{t('instructions.title')}</h1>
            
            <div style={{ marginBottom: '40px', lineHeight: '2' }}>
                <p>{t('instructions.move')}</p>
                <p>{t('instructions.dash')}</p>
                <p style={{ color: '#ffeb3b', marginTop: '20px' }}>{t('instructions.tag')}</p>
                <p>{t('instructions.score')}</p>
                <p style={{ color: '#f44336' }}>{t('instructions.avoid')}</p>
            </div>

            <button onClick={() => useGameStore.getState().setView('menu')} style={{ 
                    padding: '15px 40px', 
                    fontSize: '18px', 
                    cursor: 'pointer', 
                    backgroundColor: '#4CAF50', 
                    border: 'none', 
                    color: 'white', 
                    borderRadius: '8px',
                    fontFamily: 'inherit'
                }}>
                    {t('instructions.back')}
                </button>
        </div>
    );
};

export default InstructionsScreen;
