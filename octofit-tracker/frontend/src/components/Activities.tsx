import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = { type: string; minutes: number; points: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>();
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => setActivities(data.activities))
      .catch(() => setError('Unable to load activities'));
  }, []);

  return <section>
    <h1>Activities</h1>
    {error && <p role="alert">{error}</p>}
    {!error && !activities && <p role="status">Loading activities...</p>}
    {!error && activities?.length === 0 && <p>No activities yet.</p>}
    {!error && activities && activities.length > 0 && <ul>{activities.map((activity, index) => <li key={index}>{activity.type} — {activity.minutes} minutes — {activity.points} points</li>)}</ul>}
  </section>;
}
