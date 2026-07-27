const dns = require('node:dns').promises;
const net = require('node:net');

const hostnameChecks = new Map();

function isPrivateIpv4(address) {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIpv6(address) {
  const normalized = address.toLowerCase().split('%')[0];
  if (normalized === '::' || normalized === '::1' || normalized.startsWith('::')) return true;
  if (normalized.startsWith('2001:db8:')) return true;

  const firstGroup = Number.parseInt(normalized.split(':')[0], 16);
  return (
    !Number.isInteger(firstGroup) ||
    (firstGroup & 0xfe00) === 0xfc00 ||
    (firstGroup & 0xffc0) === 0xfe80 ||
    (firstGroup & 0xff00) === 0xff00
  );
}

function isPrivateAddress(address) {
  const family = net.isIP(address);
  if (family === 4) return isPrivateIpv4(address);
  if (family === 6) return isPrivateIpv6(address);
  return true;
}

async function assertPublicHostname(hostname) {
  const normalizedHostname = hostname.toLowerCase().replace(/\.$/, '');
  const host = normalizedHostname.startsWith('[') && normalizedHostname.endsWith(']')
    ? normalizedHostname.slice(1, -1)
    : normalizedHostname;
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.lan')
  ) {
    throw new Error(`private hostname is not allowed: ${hostname}`);
  }

  if (!hostnameChecks.has(host)) {
    hostnameChecks.set(host, (async () => {
      const literalFamily = net.isIP(host);
      const addresses = literalFamily
        ? [{ address: host }]
        : await dns.lookup(host, { all: true, verbatim: true });

      if (addresses.length === 0) throw new Error(`hostname did not resolve: ${hostname}`);
      for (const { address } of addresses) {
        if (isPrivateAddress(address)) {
          throw new Error(`hostname resolves to a private or reserved address: ${hostname}`);
        }
      }
    })());
  }

  await hostnameChecks.get(host);
}

async function assertPublicHttpUrl(input, base) {
  const raw = String(input || '').trim();
  if (!raw) throw new Error('URL required');

  const candidate = base
    ? new URL(raw, base)
    : new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);

  if (!['http:', 'https:'].includes(candidate.protocol)) {
    throw new Error('only HTTP and HTTPS URLs are allowed');
  }
  if (candidate.username || candidate.password) {
    throw new Error('URLs containing credentials are not allowed');
  }

  await assertPublicHostname(candidate.hostname);
  return candidate;
}

module.exports = {
  assertPublicHttpUrl,
  isPrivateAddress,
};
