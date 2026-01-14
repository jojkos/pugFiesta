CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT NOT NULL CHECK (char_length(player_name) <= 15),
  score INTEGER NOT NULL CHECK (score >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard;

-- RLS policies
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read leaderboard" ON leaderboard
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert score" ON leaderboard
  FOR INSERT WITH CHECK (true);
