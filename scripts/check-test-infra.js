import net from "node:net";

const targets = [
  { name: "Postgres", host: "127.0.0.1", port: 5433 },
  { name: "Redis", host: "127.0.0.1", port: 6380 },
];

function probe({ host, port }) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(1500);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

const results = await Promise.all(
  targets.map(async (t) => ({ ...t, ok: await probe(t) }))
);
const down = results.filter((r) => !r.ok);

if (down.length > 0) {
  const list = down.map((d) => `${d.name} (:${d.port})`).join(", ");
  console.error(
    `\n  Test infrastructure unreachable: ${list}\n` +
      `  Start it with:  pnpm test:infra\n`
  );
  process.exit(1);
}
