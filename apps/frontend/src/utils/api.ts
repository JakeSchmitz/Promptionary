const API_BASE_URL = 'http://localhost:3000/api';

export const createGame = async (roomId: string) => {
  const res = await fetch(`${API_BASE_URL}/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId }),
  });
  if (!res.ok) throw new Error('Failed to create game');
  return res.json();
};

export const getGame = async (roomId: string) => {
  const res = await fetch(`${API_BASE_URL}/games/${roomId}`);
  if (!res.ok) throw new Error('Failed to fetch game');
  return res.json();
};

export const addPlayer = async (roomId: string, name: string) => {
  const res = await fetch(`${API_BASE_URL}/games/${roomId}/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to add player');
  return res.json();
};

export const startGame = async (roomId: string) => {
  const res = await fetch(`${API_BASE_URL}/games/${roomId}/start`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to start game');
  return res.json();
};

export const nextRound = async (roomId: string) => {
  const res = await fetch(`${API_BASE_URL}/games/${roomId}/next-round`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to start next round');
  return res.json();
};

export const generateImage = async (prompt: string, roomId: string, playerId: string) => {
  const res = await fetch(`${API_BASE_URL}/games/${roomId}/generate-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, playerId }),
  });
  if (!res.ok) throw new Error('Failed to generate image');
  return res.json();
};

export const vote = async (roomId: string, imageId: string, voterId: string) => {
  const res = await fetch(`${API_BASE_URL}/games/${roomId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageId, voterId }),
  });
  if (!res.ok) throw new Error('Failed to submit vote');
  return res.json();
};

export const getGameHistory = async (playerIdWithQuery: string) => {
  const res = await fetch(`${API_BASE_URL}/players/${playerIdWithQuery}/games`);
  if (!res.ok) throw new Error('Failed to fetch game history');
  return res.json();
}; 