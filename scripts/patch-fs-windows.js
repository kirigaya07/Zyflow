/**
 * Windows build patch for Next.js / @vercel/nft.
 *
 * @vercel/nft does static analysis and evaluates os.homedir() to find
 * credential files (e.g. google-auth-library looks for gcloud creds in ~).
 * On Windows this causes a glob of C:\Users\anmol which hits protected
 * junction points (Application Data, Cookies, etc.) causing EPERM/OOM.
 *
 * Fix: when os.homedir() is called from @vercel/nft, return a path that
 * doesn't exist so the glob finds nothing and exits immediately.
 */
const os = require("os");
const origHomedir = os.homedir;

os.homedir = function () {
  const stack = new Error().stack || "";
  if (stack.includes("@vercel/nft") || stack.includes("nft/index.js")) {
    return "/nft-stub-nonexistent";
  }
  return origHomedir.apply(this, arguments);
};
