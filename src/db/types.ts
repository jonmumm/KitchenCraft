import { z } from "zod";
import {
  AccountSchema,
  NewAccountSchema,
  NewSessionSchema,
  NewUserSchema,
  NewVerificatoknTokenSchema,
  SessionSchema,
  UserSchema,
  VerificationTokenSchema,
} from "./schema";

export type User = z.infer<typeof UserSchema>;
export type NewUser = z.infer<typeof NewUserSchema>;

export type Account = z.infer<typeof AccountSchema>;
export type NewAccount = z.infer<typeof NewAccountSchema>;

export type Session = z.infer<typeof SessionSchema>;
export type NewSession = z.infer<typeof NewSessionSchema>;

export type VerificationToken = z.infer<typeof VerificationTokenSchema>;
export type NewVerificatoknToken = z.infer<typeof NewVerificatoknTokenSchema>;
