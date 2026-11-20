import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') throw httpError(400, 'Invalid activity');
  const body = input as Record<string, unknown>;
  const { userId, teamId, type, minutes } = body;
  if (typeof userId !== 'string' || typeof teamId !== 'string' || typeof type !== 'string') {
    throw httpError(400, 'userId, teamId, and type are required');
  }
  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(teamId)) {
    throw httpError(400, 'Invalid user or team ID');
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw httpError(400, 'Minutes must be a positive number');
  }
  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw httpError(404, 'User or team not found');

  return Activity.create({
    user: user._id,
    team: team._id,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') throw httpError(400, 'Invalid team');
  const body = input as Record<string, unknown>;
  if (typeof body.name !== 'string' || body.name.trim() === '') {
    throw httpError(400, 'Team name is required');
  }
  if (typeof body.mascot !== 'string' || body.mascot.trim() === '') {
    throw httpError(400, 'Team mascot is required');
  }
  const members = Array.isArray(body.members)
    ? body.members.filter((member): member is string => typeof member === 'string' && mongoose.isValidObjectId(member))
    : [];
  return Team.create({ name: body.name.trim(), mascot: body.mascot.trim(), members });
}

export async function getLeaderboard() {
  const teams = await Team.find().lean();
  const totals = await Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
  ]);
  const totalsByTeam = new Map(totals.map((entry) => [entry._id.toString(), entry.totalPoints]));
  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: totalsByTeam.get(team._id.toString()) ?? 0,
      rank: 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: decodeURIComponent(userEmail) });
  if (!user) throw httpError(404, 'User not found');

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const activityType = recentActivity?.type?.toLowerCase();
  const focus = activityType === 'run' || activityType === 'walk' || activityType === 'cycle'
    ? 'endurance'
    : activityType === 'strength'
      ? 'strength'
      : user.fitnessGoal;

  const workouts = await Workout.find().lean();
  const matching = workouts.filter((workout) => workout.focus === focus);
  const others = workouts.filter((workout) => workout.focus !== focus);
  const ordered = [...matching, ...others];
  if (ordered.length === 0) return [];

  const first = ordered[0];
  const reason = recentActivity
    ? `Based on your recent ${activityType} activity and ${focus} goal`
    : `Based on your ${focus} fitness goal`;
  return [{ ...first, reason }, ...ordered.slice(1)];
}

export { User };
