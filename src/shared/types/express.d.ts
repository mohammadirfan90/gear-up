import { UserRole, UserStatus } from '@/modules/auth/auth.types';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        status: UserStatus;
      };
    }
  }
}

export {};