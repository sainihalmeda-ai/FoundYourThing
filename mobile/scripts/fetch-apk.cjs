/**
 * Pull the latest FYT APK into public/download/FYT.apk before web export
 * so phones download from our domain (no Expo redirect breakage).
 */
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const APK_URL =
  process.env.FYT_APK_ARTIFACT_URL ||
  "https://expo.dev/artifacts/eas/qmW7A61f54hhPwN_y1xwrA5kgGE1ElC1gqu5Wlcu-U0.apk";

const outDir = path.join(__dirname, "..", "public", "download");
const outFile = path.join(outDir, "FYT.apk");

function follow(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 8) {
      reject(new Error("Too many redirects"));
      return;
    }
    const lib = url.startsWith("http://") ? http : https;
    lib
      .get(url, { headers: { "User-Agent": "FYT-fetch-apk" } }, (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          res.resume();
          resolve(follow(res.headers.location, redirects + 1));
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          res.resume();
          return;
        }
        resolve(res);
      })
      .on("error", reject);
  });
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  console.log(`[fetch-apk] ${APK_URL}`);
  const res = await follow(APK_URL);
  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outFile);
    res.pipe(file);
    file.on("finish", () => file.close(resolve));
    file.on("error", reject);
    res.on("error", reject);
  });
  const size = fs.statSync(outFile).size;
  if (size < 1_000_000) {
    throw new Error(`APK too small (${size} bytes) — download failed`);
  }
  console.log(`[fetch-apk] wrote ${outFile} (${size} bytes)`);
}

main().catch((err) => {
  console.error("[fetch-apk]", err);
  process.exit(1);
});
