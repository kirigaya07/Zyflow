/**
 * SSRF (Server-Side Request Forgery) protection.
 *
 * Workflow nodes (HTTP Request, MCP) let authenticated users supply an
 * arbitrary URL that the server then fetches. Without guarding, a user could
 * point that URL at internal-only services — cloud metadata endpoints
 * (169.254.169.254), localhost admin panels, or other private-network hosts —
 * and exfiltrate secrets or pivot inside the network.
 *
 * `assertSafeUrl` rejects anything that isn't a plain http(s) request to a
 * publicly-routable host. It resolves the hostname via DNS first, so a public
 * name that points at a private IP (DNS-rebinding style) is also blocked.
 */

import { lookup } from "node:dns/promises";
import net from "node:net";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/** True if an IPv4/IPv6 address is loopback, private, link-local, or otherwise non-public. */
function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const octets = ip.split(".").map(Number);
    const [a, b] = octets;
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // loopback
    if (a === 0) return true; // "this" network
    if (a === 169 && b === 254) return true; // link-local (cloud metadata)
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 (CGNAT)
    if (a >= 224) return true; // multicast / reserved
    return false;
  }

  if (net.isIPv6(ip)) {
    const addr = ip.toLowerCase();
    if (addr === "::1" || addr === "::") return true; // loopback / unspecified
    if (addr.startsWith("fe80")) return true; // link-local
    if (addr.startsWith("fc") || addr.startsWith("fd")) return true; // unique-local fc00::/7
    // IPv4-mapped / -compatible IPv6 — re-check the embedded IPv4
    const mapped = addr.match(/(?:::ffff:)?(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    return false;
  }

  // Unknown format — treat as unsafe.
  return true;
}

/**
 * Validates a user-supplied URL for outbound server-side fetches.
 * Returns the URL string on success; throws on any unsafe target.
 */
export async function assertSafeUrl(rawUrl: string): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new Error(`Blocked URL scheme "${parsed.protocol}" — only http and https are allowed`);
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, ""); // strip IPv6 brackets

  // Direct IP literal — validate as-is.
  if (net.isIP(hostname)) {
    if (isPrivateAddress(hostname)) {
      throw new Error("Blocked request to a private or reserved IP address");
    }
    return parsed.toString();
  }

  // Block obvious internal names without a public suffix.
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".internal")) {
    throw new Error("Blocked request to an internal hostname");
  }

  // Resolve DNS and ensure no resolved address is private.
  let addresses: { address: string }[];
  try {
    addresses = await lookup(hostname, { all: true });
  } catch {
    throw new Error(`Could not resolve host "${hostname}"`);
  }

  if (addresses.length === 0) {
    throw new Error(`Could not resolve host "${hostname}"`);
  }

  for (const { address } of addresses) {
    if (isPrivateAddress(address)) {
      throw new Error("Blocked request to a host that resolves to a private IP address");
    }
  }

  return parsed.toString();
}
