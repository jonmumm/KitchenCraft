import { z } from "zod";
import {
  AccountSchema,
  MediaSchema,
  NewAccountSchema,
  NewMediaSchema,
  NewRecipeSchema,
  NewSessionSchema,
  NewUserSchema,
  NewVerificatoknTokenSchema,
  RecipeSchema,
  SessionSchema,
  UserSchema,
  VerificationTokenSchema,
} from "./schema";

export type User = z.infer<typeof UserSchema>;
export type NewUser = z.infer<typeof NewUserSchema>;

export type Account = z.infer<typeof AccountSchema>;
export type NewAccount = z.infer<typeof NewAccountSchema>;

export type Recipe = z.infer<typeof RecipeSchema>;
export type NewRecipe = z.infer<typeof NewRecipeSchema>;

export type Session = z.infer<typeof SessionSchema>;
export type NewSession = z.infer<typeof NewSessionSchema>;

export type VerificationToken = z.infer<typeof VerificationTokenSchema>;
export type NewVerificatoknToken = z.infer<typeof NewVerificatoknTokenSchema>;

export type Media = z.infer<typeof MediaSchema>;
export type NewMedia = z.infer<typeof NewMediaSchema>;