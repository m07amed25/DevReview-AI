import { inngest } from "../client";
import { db } from "../../db";
import { sendBroadcastEmail } from "../../email/service";

export const broadcastEmail = inngest.createFunction(
  { 
    id: "broadcast-email", 
    name: "Broadcast Email",
    triggers: [{ event: "app/email.broadcast" }]
  },
  async ({ event, step }) => {
    const { subject, body, target } = event.data as {
      subject: string;
      body: string;
      target: "ALL" | "FREE" | "PRO" | string[]; // string[] for specific emails
    };

    // 1. Fetch users based on target
    const users = await step.run("fetch-users", async () => {
      if (Array.isArray(target)) {
        return db.user.findMany({
          where: { email: { in: target } },
          select: { email: true, name: true },
        });
      }

      const where: any = {};
      if (target === "FREE") {
        where.planId = "free";
      } else if (target === "PRO") {
        where.planId = { not: "free" };
      }

      return db.user.findMany({
        where,
        select: { email: true, name: true },
      });
    });

    // 2. Send emails in chunks to avoid overwhelming the SMTP server or hitting limits
    const CHUNK_SIZE = 50;
    const results = [];

    for (let i = 0; i < users.length; i += CHUNK_SIZE) {
      const chunk = users.slice(i, i + CHUNK_SIZE);
      
      const chunkResults = await step.run(`send-chunk-${i}`, async () => {
        const promises = chunk.map((user) =>
          sendBroadcastEmail({
            to: user.email,
            subject,
            body,
            userName: user.name || undefined,
          })
        );
        return Promise.all(promises);
      });
      
      results.push(...chunkResults);
    }

    return {
      sent: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      total: users.length,
    };
  }
);
