import { Resend } from "resend";
import { fromPromise } from "xstate";

export const sendWelcomeEmail = fromPromise(
  async ({ input }: { input: { email: string } }) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: "KitchenCraft <signin@mail.kitchencraft.ai>",
      to: input.email,
      subject: "Welcome to KithenCraft",
      text: `Welcome to KitchenCraft. Let's fill this in more later.`,
      html: `<div><p>Welcome to KitchenCraft. Let's fill this in more later.`,
    });
    if (result.error) {
      throw new Error(result.error.message);
    }
  }
);
