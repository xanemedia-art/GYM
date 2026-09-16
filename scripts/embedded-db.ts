import EmbeddedPostgres from "embedded-postgres";
import path from "path";

async function main() {
  console.log("🚀 Starting Embedded PostgreSQL on port 5432...");
  const dbDir = path.resolve("./.pgdata");

  const ep = new EmbeddedPostgres({
    port: 5432,
    databaseDir: dbDir,
    user: "postgres",
    password: "password",
    persistent: true,
  } as any);

  try {
    await ep.initialise();
  } catch (initErr: any) {
    console.log("Initialization note (may already be initialized):", initErr.message);
  }

  await ep.start();
  console.log("✅ Embedded PostgreSQL is listening on port 5432");

  try {
    await ep.createDatabase("gym_saas");
    console.log("✅ Database 'gym_saas' created");
  } catch (dbErr: any) {
    console.log("Note: Database 'gym_saas' already exists or ready.");
  }

  // Keep process alive if run directly
  process.on("SIGINT", async () => {
    console.log("Stopping Embedded PostgreSQL...");
    await ep.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Failed to start Embedded PostgreSQL:", err);
});
