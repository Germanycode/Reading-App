import { spawnSync } from "node:child_process";

const [command, distDir = ".next-build", ...extraArgs] = process.argv.slice(2);

if (!command) {
  console.error("Usage: node scripts/next-with-dist.mjs <build|start> [distDir] [...args]");
  process.exit(1);
}

const result = spawnSync(process.execPath, ["node_modules/next/dist/bin/next", command, ...extraArgs], {
  env: {
    ...process.env,
    NEXT_DIST_DIR: distDir
  },
  stdio: "inherit"
});

process.exit(result.status ?? 1);
