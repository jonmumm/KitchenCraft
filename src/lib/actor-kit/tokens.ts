import { jwtVerify } from "jose";
import { assert } from "../utils";

export const parseTokenForId = async (token: string) => {
  const verified = await jwtVerify(
    token,
    new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
  );
  assert(verified.payload.jti, "expected JTI on User Token");
  return verified;
};
