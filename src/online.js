import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const configured = Boolean(url && publishableKey);
const supabase = configured ? createClient(url, publishableKey, {
  realtime: { params: { eventsPerSecond: 15 } },
}) : null;

export const onlineConfigured = configured;
export const makePlayerId = () => globalThis.crypto?.randomUUID?.() || `driver-${Math.random().toString(36).slice(2)}`;
export const normalizeRoomCode = (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);

function makeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  if (!globalThis.crypto?.getRandomValues) return Math.random().toString(36).slice(2, 9).toUpperCase();
  const bytes = new Uint8Array(7);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

function subscribe(channel) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Connection timed out. Check your internet and try again.')), 12000);
    channel.subscribe((status, error) => {
      if (status === 'SUBSCRIBED') { clearTimeout(timeout); resolve(); }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        clearTimeout(timeout);
        reject(new Error(error?.message || 'Could not connect to the online race service.'));
      }
    });
  });
}

function playersIn(channel) {
  return Object.values(channel.presenceState()).flat().map((presence) => ({
    id: presence.playerId,
    name: presence.name || 'DRIVER',
    role: presence.role,
    ready: Boolean(presence.ready),
    mapId: presence.mapId,
  }));
}

async function openSession({ code, role, name, mapId, playerId, onState, onPlayers, onStart }) {
  if (!supabase) throw new Error('Online rooms need the Supabase URL and publishable key to be configured.');
  const channel = supabase.channel(`race-${code}`, {
    config: { broadcast: { self: false, ack: false }, presence: { key: playerId } },
  });
  channel
    .on('broadcast', { event: 'race-state' }, ({ payload }) => onState?.(payload))
    .on('broadcast', { event: 'race-start' }, ({ payload }) => onStart?.(payload))
    .on('presence', { event: 'sync' }, () => onPlayers?.(playersIn(channel)))
    .on('presence', { event: 'join' }, () => onPlayers?.(playersIn(channel)))
    .on('presence', { event: 'leave' }, () => onPlayers?.(playersIn(channel)));
  try {
    await subscribe(channel);
    const existing = playersIn(channel);
    if (role === 'guest' && !existing.some((player) => player.role === 'host')) {
      throw new Error('That room is not open. Check the code or ask the host to create a new room.');
    }
    if (existing.length >= 2) throw new Error('This room already has two drivers.');
    const local = { playerId, name: name.trim().slice(0, 18) || 'DRIVER', role, ready: role === 'host', mapId };
    const tracked = await channel.track(local);
    if (tracked !== 'ok') throw new Error('Could not join the room. Please try again.');
    onPlayers?.(playersIn(channel));
    return {
      code,
      role,
      playerId,
      channel,
      sendState: (state) => channel.send({ type: 'broadcast', event: 'race-state', payload: { ...state, playerId, name: local.name } }).catch(() => {}),
      sendStart: (startAt, selectedMap) => channel.send({ type: 'broadcast', event: 'race-start', payload: { startAt, mapId: selectedMap, hostId: playerId } }),
      setReady: async (ready) => { local.ready = ready; await channel.track(local); onPlayers?.(playersIn(channel)); },
      close: async () => { await channel.untrack(); await supabase.removeChannel(channel); },
    };
  } catch (error) {
    await supabase.removeChannel(channel);
    throw error;
  }
}

export function createRaceRoom({ name, mapId, playerId, onState, onPlayers, onStart }) {
  return openSession({ code: makeCode(), role: 'host', name, mapId, playerId, onState, onPlayers, onStart });
}

export function joinRaceRoom({ code, name, playerId, onState, onPlayers, onStart }) {
  const roomCode = normalizeRoomCode(code);
  if (roomCode.length !== 7) throw new Error('Enter the 7-character room code.');
  return openSession({ code: roomCode, role: 'guest', name, mapId: '', playerId, onState, onPlayers, onStart });
}
