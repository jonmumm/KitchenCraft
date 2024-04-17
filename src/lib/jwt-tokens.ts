import { privateEnv } from "@/env.secrets";
import { jwtVerify } from "jose";

export interface UserJwtPayload {
  jti: string;
  iat: number;
  sub: string;
}

export const verifyToken = async (token: string) => {
  const verified = await jwtVerify(
    token,
    new TextEncoder().encode(privateEnv.NEXTAUTH_SECRET)
  );
  return verified.payload as UserJwtPayload;
};
