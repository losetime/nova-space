import { Request } from 'express';

interface UserPayload {
  id: string;
  username: string;
  role: string;
  level: string;
}

export interface RequestWithUser extends Request {
  user: UserPayload;
}