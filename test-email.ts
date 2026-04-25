import { sendGithubConnectionWarningEmail } from "./src/server/email/service";

async function main() {
  const res = await sendGithubConnectionWarningEmail({
    to: "test@example.com",
    userName: "Test User",
  });
  console.log("Result:", res);
}
main();
