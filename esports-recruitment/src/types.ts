// src/types.ts - TypeScript Types for Esports Recruitment Platform

export interface User {
  id: string;
  player_id: string;
  username: string;
  fullname: string;
  email: string;
  high_score: number;
  passwordHash: string;
  created_at: string;
}

export interface SessionInfo {
  isLoggedIn: boolean;
  user: {
    id: string;
    player_id: string;
    username: string;
    fullname: string;
    email: string;
    high_score: number;
  } | null;
}

export type ViewType = 'landing' | 'login' | 'register' | 'game';

export interface GameStar {
  x: number;
  y: number;
  radius: number;
  hue: number;
}
