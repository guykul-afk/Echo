export interface User {
  id: string; // Firebase Auth UID
  email: string;
  createdAt: number; // epoch ms
  lastLoginAt?: number;
}
