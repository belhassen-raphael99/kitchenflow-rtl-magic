const ENCRYPTION_KEY_ENV = "TOTP_ENCRYPTION_KEY";

async function getKey(): Promise<CryptoKey> {
  const keyHex = Deno.env.get(ENCRYPTION_KEY_ENV);
  if (!keyHex) throw new Error("TOTP_ENCRYPTION_KEY not configured");
  const keyBytes = new Uint8Array(keyHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const combined = new Uint8Array([...iv, ...new Uint8Array(ciphertext)]);
  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(encryptedB64: string): Promise<string> {
  const key = await getKey();
  const combined = new Uint8Array(atob(encryptedB64).split("").map(c => c.charCodeAt(0)));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(decrypted);
}
