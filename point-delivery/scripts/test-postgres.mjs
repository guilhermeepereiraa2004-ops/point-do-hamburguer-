import { spawnSync } from "node:child_process";
const result = spawnSync(process.execPath, ["--test", "tests/admin-access.test.mjs", "tests/burger-composition.test.mjs", "tests/management.test.mjs", "tests/order-reservation.test.mjs", "tests/cart.test.mjs", "tests/order-tracking.test.mjs", "tests/request-origin.test.mjs", "tests/menu-images.test.mjs"], { stdio: "inherit", env: { ...process.env, TEST_DATABASE: "postgres" } });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
