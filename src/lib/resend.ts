import { privateEnv } from "@/env.secrets";
import { Resend } from "resend";


export const resend = new Resend(privateEnv.RESEND_API_KEY);