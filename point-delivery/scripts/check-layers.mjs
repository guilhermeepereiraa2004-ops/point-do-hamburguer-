import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
const failures = [];
function check(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { check(file); continue; }
    if (!/\.[cm]?[jt]sx?$/.test(file)) continue;
    const source = readFileSync(file, "utf8");
    const imports = [...source.matchAll(/(?:from\s+|import\s*\()(["'])([^"']+)\1/g)].map(match => match[2]);
    if (directory === "domain" && imports.some(target => /(?:actions|components|app|db|next|clerk|drizzle)/.test(target))) failures.push(`${file}: domínio depende de camada externa`);
    if (/^[\s]*["']use client["']/.test(source) && imports.some(target => /(?:^@\/|^\.\.\/)(?:db|actions)\//.test(target) || /server-only|cloudflare:workers/.test(target))) failures.push(`${file}: cliente importa servidor`);
    if ((file.startsWith(`app${path.sep}`) || file.startsWith(`actions${path.sep}`)) && source.includes('from "cloudflare:workers"')) failures.push(`${file}: runtime Cloudflare no servidor Vercel`);
  }
}
for (const folder of ["domain", "components", "app", "actions"]) check(folder);
if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; } else console.log("Camadas verificadas.");
