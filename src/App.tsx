import React from 'react';
import GameScreen from './screens/GameScreen';
import MenuScreen from './screens/MenuScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import InstructionsScreen from './screens/InstructionsScreen';
import { useGameStore } from './stores/gameStore';

const App: React.FC = () => {
  const { currentView } = useGameStore();

  return (
    <>
      {currentView === 'menu' && <MenuScreen />}
      {currentView === 'game' && <GameScreen />}
      {currentView === 'leaderboard' && <LeaderboardScreen />}
      {currentView === 'instructions' && <InstructionsScreen />}
    </>
  );
};

export default App;
