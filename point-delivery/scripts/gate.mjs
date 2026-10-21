import { spawnSync } from "node:child_process";
const steps = [
  ["node_modules/typescript/bin/tsc", "--noEmit"],
  ["scripts/check-layers.mjs"],
  ["--test", "tests/burger-composition.test.mjs", "tests/management.test.mjs", "tests/order-reservation.test.mjs", "tests/admin-access.test.mjs"],
  ["node_modules/next/dist/bin/next", "build", "--webpack"],
];
for (const args of steps) {
  const result = spawnSync(process.execPath, args, { stdio: "inherit", env: { ...process.env, TEST_DATABASE: "postgres", NEXT_TELEMETRY_DISABLED: "1" } });
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}
