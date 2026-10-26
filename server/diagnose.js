// diagnose.js
// Collects everything needed to find out why Pine isn't starting and writes it
// to the project folder as diagnostics.txt. Run it with CHECK-FLEXI.bat (or: node diagnose.js).
// It never prints passwords or the JWT secret.

const fs = require("fs");
const path = require("path");
const net = require("net");
const { execSync, spawn } = require("child_process");

const SERVER_DIR = __dirname;
const ROOT = path.join(SERVER_DIR, "..");
const OUT = path.join(ROOT, "diagnostics.txt");
const lines = [];
const log = (...a) => {
  const line = a.join(" ");
  lines.push(line);
  console.log(line);
};
const section = (t) => log(`\n===== ${t}`);
const save = () => fs.writeFileSync(OUT, lines.join("\n") + "\n");

function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 15000 }).trim();
  } catch (e) {
    return `(command failed: ${(e.stderr || e.message || "").toString().trim().split("\n")[0]})`;
  }
}

function portCheck(port, host) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", (e) => resolve(`cannot listen (${e.code})`));
    srv.once("listening", () => srv.close(() => resolve("free")));
    srv.listen(port, host);
  });
}

async function fetchText(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const body = (await r.text()).slice(0, 200).replace(/\s+/g, " ");
    return `HTTP ${r.status} ${body}`;
  } catch (e) {
    return `FAILED: ${e.cause?.code || e.name || e.message}`;
  }
}

(async () => {
  log(`Pine diagnostics  ${new Date().toString()}`);

  section("Environment");
  log("node:", process.version, "| platform:", process.platform, process.arch);
  log("npm:", run("npm -v"));
  log("folder:", ROOT);
  log("server/node_modules:", fs.existsSync(path.join(SERVER_DIR, "node_modules")) ? "yes" : "MISSING");
  log("client/node_modules:", fs.existsSync(path.join(ROOT, "client", "node_modules")) ? "yes" : "MISSING");

  section("server/.env (secrets hidden)");
  const envPath = path.join(SERVER_DIR, ".env");
  if (!fs.existsSync(envPath)) {
    log("server/.env is MISSING");
  } else {
    require("dotenv").config({ path: envPath });
    log("PORT =", process.env.PORT || "(not set, default 5000)");
    log("MONGODB_URI =", (process.env.MONGODB_URI || "(not set)").replace(/\/\/([^@/]+)@/, "//***:***@"));
    log("JWT_SECRET =", process.env.JWT_SECRET ? `set (${process.env.JWT_SECRET.length} chars)` : "NOT SET");
    log("CLIENT_URL =", process.env.CLIENT_URL || "(not set)");
  }
  const clientEnv = path.join(ROOT, "client", ".env");
  log("client/.env:", fs.existsSync(clientEnv) ? fs.readFileSync(clientEnv, "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#")).join(" | ") : "MISSING");
  save();

  const PORT = Number(process.env.PORT) || 5000;

  section("Is something already answering?");
  log(`GET http://localhost:${PORT}/api/health ->`, await fetchText(`http://localhost:${PORT}/api/health`));
  log(`GET http://127.0.0.1:${PORT}/api/health ->`, await fetchText(`http://127.0.0.1:${PORT}/api/health`));
  log("GET http://localhost:5173 ->", (await fetchText("http://localhost:5173")).slice(0, 60));
  save();

  section(`Port ${PORT}`);
  log(`listen on all addresses: ${await portCheck(PORT)}`);
  log(`listen on 127.0.0.1:   ${await portCheck(PORT, "127.0.0.1")}`);
  if (process.platform === "win32") {
    log("netstat:\n" + (run(`netstat -ano | findstr ":${PORT}"`) || "(nothing using it)"));
    log("Windows reserved port ranges:\n" + run("netsh interface ipv4 show excludedportrange protocol=tcp"));
  }
  save();

  section("MongoDB");
  if (process.platform === "win32") log("service:", run('sc query MongoDB | findstr "STATE"') || "(no service called MongoDB)");
  try {
    const mongoose = require("mongoose");
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    const db = mongoose.connection.db;
    const counts = {};
    for (const c of ["users", "spaces", "bookings"]) counts[c] = await db.collection(c).countDocuments();
    log("connected to", mongoose.connection.name, JSON.stringify(counts));
    await mongoose.disconnect();
  } catch (e) {
    log("CONNECT FAILED:", e.message);
  }
  save();

  section("Starting server.js for 12 seconds");
  const child = spawn(process.execPath, ["server.js"], { cwd: SERVER_DIR, env: process.env });
  let output = "";
  child.stdout.on("data", (d) => (output += d));
  child.stderr.on("data", (d) => (output += d));
  let exitInfo = "still running after 12 s (good)";
  child.on("exit", (code) => (exitInfo = `EXITED with code ${code}`));
  await new Promise((r) => setTimeout(r, 8000));
  log(`health while it runs (localhost): ${await fetchText(`http://localhost:${PORT}/api/health`)}`);
  log(`health while it runs (127.0.0.1): ${await fetchText(`http://127.0.0.1:${PORT}/api/health`)}`);
  await new Promise((r) => setTimeout(r, 4000));
  log("process:", exitInfo);
  log("output:\n" + output.replace(/\x1b\[[0-9;]*m/g, "").trim());
  child.kill();

  save();
  log(`\nSaved to ${OUT}`);
  process.exit(0);
})();
