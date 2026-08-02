import jwt, { Secret } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { env } from '@/shared/config/env';
import { JwtPayload, AuthTokens } from '@/modules/auth/auth.types';

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
const TOKEN_HASH_ROUNDS = 10;

export const generateTokens = async (payload: JwtPayload): Promise<AuthTokens> => {
  const accessToken = jwt.sign(payload, env.JWT_SECRET as Secret, {
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET as Secret, {
    expiresIn: REFRESH_TOKEN_TTL_SECONDS,
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };
};

export const verifyAccessToken = (token: string): JwtPayload =>
  jwt.verify(token, env.JWT_SECRET as Secret) as JwtPayload;

export const verifyRefreshToken = (token: string): JwtPayload =>
  jwt.verify(token, env.JWT_REFRESH_SECRET as Secret) as JwtPayload;

export const hashToken = (token: string): Promise<string> =>
  bcrypt.hash(token, TOKEN_HASH_ROUNDS);
