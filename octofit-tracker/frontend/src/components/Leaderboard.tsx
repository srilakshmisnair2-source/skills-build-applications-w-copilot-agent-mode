import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>();
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((data) => setLeaderboard(data.leaderboard))
      .catch(() => setError('Unable to load leaderboard'));
  }, []);

  if (error) return <p role="alert">{error}</p>;
  if (!leaderboard) return <p role="status">Loading leaderboard...</p>;
  if (leaderboard.length === 0) return <p>No leaderboard rankings yet.</p>;
  return <section><h1>Leaderboard</h1><ol>{leaderboard.map((entry) => <li key={entry.teamName}>{entry.teamName} — {entry.totalPoints} points</li>)}</ol></section>;
}
