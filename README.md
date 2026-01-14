# 🐶 Pug Banger Fiesta

A high-energy arcade game where you play as a pug trying to tag as many female pugs as possible within the time limit. Featuring retro synthwave music, responsive controls, and a global leaderboard!

## 🚀 Quick Start

1. **Clone and Install**

   ```bash
   npm install
   ```

2. **Environment Setup**
   Create a `.env.local` file in the root directory:

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run Locally**
   ```bash
   npm run dev
   ```

## ☁️ Supabase Production Setup

To enable the leaderboard in a production environment, follow these steps:

### 1. Create a Supabase Project

Go to [supabase.com](https://supabase.com) and create a new project.

### 2. Initialize Database

Go to the **SQL Editor** in your Supabase dashboard and run the following script to create the leaderboard table and set up Row Level Security (RLS):

```sql
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT NOT NULL CHECK (char_length(player_name) <= 15),
  score INTEGER NOT NULL CHECK (score >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime (optional)
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard;

-- Enable Row Level Security (RLS)
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Anyone can read leaderboard" ON leaderboard
  FOR SELECT USING (true);

-- Allow public insert access
CREATE POLICY "Anyone can insert score" ON leaderboard
  FOR INSERT WITH CHECK (true);
```

### 3. Configure Environment Variables

Copy your **Project URL** and **Anon Key** from `Settings -> API` and add them to your production environment (e.g., Vercel, Netlify) or your local `.env.local` file.

## 🕹️ Controls

- **Movement:** `W`, `A`, `S`, `D` or **Joystick** (on mobile)
- **Dash:** `Space` or **Dash Button** (on mobile)
- **Menu:** `ESC` or **Menu Button** in-game

## 🛠️ Tech Stack

- **Framework:** React + Vite
- **Language:** TypeScript
- **State Management:** Zustand
- **Database:** Supabase
- **Audio:** Tone.js
- **i18n:** react-i18next
- **Styling:** Vanilla CSS
