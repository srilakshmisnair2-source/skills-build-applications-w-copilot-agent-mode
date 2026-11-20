import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { name: string; members?: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>();
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => setTeams(data.teams))
      .catch(() => setError('Unable to load teams'));
  }, []);

  if (error) return <p role="alert">{error}</p>;
  if (!teams) return <p role="status">Loading teams...</p>;
  if (teams.length === 0) return <p>No teams available.</p>;
  return <section><h1>Teams</h1><ul>{teams.map((team, index) => <li key={index}>{team.name}{team.members?.length ? ` — ${team.members.join(', ')}` : ''}</li>)}</ul></section>;
}
