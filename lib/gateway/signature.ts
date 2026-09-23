/**
 * Callback signature verification: hmac_sha256(raw_body, sha256(merchantToken)).
 *
 * VENDORED from the merchant SDK "payment-gateway-checkout" v1.3.0
 * (payment-gateway-custom-site-sdk.zip, supplied by the processor). Kept as
 * source rather than an npm dependency so the server and browser halves stay
 * in separate modules — importing the package barrel would pull merchant-token
 * code into the client bundle. Only the relative import extensions were
 * changed. Re-vendor from src/ on an SDK upgrade; do not hand-edit.
 */

export async function verifyGatewayCallbackSignature(options: {
  rawBody: string;
  signature: string | null | undefined;
  merchantToken: string;
}): Promise<boolean> {
  if (!options.signature || !options.merchantToken) {
    return false;
  }

  const tokenHash = await sha256Hex(options.merchantToken);
  const expected = await hmacSha256Hex(options.rawBody, tokenHash);
  return timingSafeEqualHex(expected, options.signature);
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(hash));
}

async function hmacSha256Hex(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(signature));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqualHex(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < left.length; index++) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
}
