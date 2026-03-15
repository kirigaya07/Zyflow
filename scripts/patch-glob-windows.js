/**
 * Patches Next.js compiled glob to silently ignore EPERM/EACCES errors
 * on Windows junction points (Application Data, Cookies, etc.)
 * that occur during @vercel/nft file tracing.
 * Run via postinstall: "postinstall": "node scripts/patch-glob-windows.js"
 */
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../node_modules/next/dist/compiled/glob/glob.js");

if (!fs.existsSync(file)) {
  console.log("[patch-glob] glob.js not found, skipping");
  process.exit(0);
}

let content = fs.readFileSync(file, "utf8");

if (content.includes("__GLOB_WIN_PATCHED__")) {
  console.log("[patch-glob] already patched");
  process.exit(0);
}

let patched = content;

// 1. Don't emit error event for EPERM/EACCES (prevents unhandledRejection)
patched = patched.replace(
  'if(this.strict){this.emit("error",e);this.abort()}',
  'if(this.strict&&e.code!=="EPERM"&&e.code!=="EACCES"){this.emit("error",e);this.abort()}'
);

// 2. Don't log glob error for EPERM/EACCES
patched = patched.replace(
  'if(!this.silent)console.error("glob error",e)',
  'if(!this.silent&&e.code!=="EPERM"&&e.code!=="EACCES")console.error("glob error",e)'
);

// 3. In lstatcb_, treat EPERM/EACCES like ENOENT (skip, don't recurse)
patched = patched.replace(
  'if(r&&r.code==="ENOENT")return e()',
  'if(r&&(r.code==="ENOENT"||r.code==="EPERM"||r.code==="EACCES"))return e()'
);

if (patched === content) {
  console.log("[patch-glob] WARNING: no patterns matched — glob.js may have changed");
  process.exit(0);
}

fs.writeFileSync(file, patched + "\n/* __GLOB_WIN_PATCHED__ */");
console.log("[patch-glob] patched successfully");
