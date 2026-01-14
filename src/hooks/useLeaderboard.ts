import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  created_at: string;
}

export function useLeaderboard() {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScores = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(100);

      if (error) throw error;
      setScores(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitScore = async (playerName: string, score: number) => {
    if (!playerName.trim()) return;
    try {
      const { error } = await supabase
        .from('leaderboard')
        .insert([{ player_name: playerName, score }]);

      if (error) throw error;
      // Refresh scores after submission
      await fetchScores();
    } catch (err: any) {
        console.error('Error submitting score:', err);
        // Optionally handle error
    }
  };

  useEffect(() => {
    fetchScores();
    
    // Realtime subscription
    const channel = supabase
      .channel('public:leaderboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leaderboard' }, (_payload) => {
          // Optimistically update or re-fetch
          // For simplicity, just append if it's high enough or re-fetch
          fetchScores(); 
      })
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, []);

  return { scores, loading, error, submitScore, fetchScores };
}
