import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Workout = { title: string; reason?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[]>();
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ suggestions: Workout[] }>('/api/workouts/suggestions/mona%40example.com')
      .then((data) => setSuggestions(data.suggestions))
      .catch(() => setError('Unable to load workout suggestions'));
  }, []);

  if (error) return <p role="alert">{error}</p>;
  if (!suggestions) return <p role="status">Loading workout suggestions...</p>;
  if (suggestions.length === 0) return <p>No workout suggestions available.</p>;
  return <section><h1>Workout suggestions</h1><ul>{suggestions.map((workout, index) => <li key={index}>{workout.title}{workout.reason ? ` — ${workout.reason}` : ''}</li>)}</ul></section>;
}
