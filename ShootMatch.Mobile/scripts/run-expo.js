const { spawnSync } = require("child_process");
const path = require("path");

const sdk = process.env.ANDROID_HOME || "D:\\androidsdk";
process.env.ANDROID_HOME = sdk;
process.env.ANDROID_SDK_ROOT = process.env.ANDROID_SDK_ROOT || sdk;

const sep = path.delimiter;
const extra = [
  path.join(sdk, "platform-tools"),
  path.join(sdk, "emulator"),
];
process.env.PATH = [...extra, process.env.PATH].filter(Boolean).join(sep);

const args = ["expo", ...process.argv.slice(2)];
const result = spawnSync("npx", args, {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
