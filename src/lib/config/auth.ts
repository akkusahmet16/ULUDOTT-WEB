import "server-only";
export function authKey(): Buffer {
  const value = process.env.AUTH_ENCRYPTION_KEY;
  if (!value || !/^[a-f0-9]{64}$/i.test(value) || /^0+$/.test(value))
    throw new Error("Eksik veya geçersiz AUTH_ENCRYPTION_KEY.");
  return Buffer.from(value, "hex");
}
