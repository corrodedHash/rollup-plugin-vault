import { ResultChecksum, hexToArray, buf2hex } from "./util";

export async function check_static(value: string, dj: ResultChecksum) {
  let enc = new TextEncoder();

  let encoded_key = await crypto.subtle.importKey(
    "raw",
    enc.encode(value),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  let derived_key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: hexToArray(dj.salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    encoded_key,
    { name: "AES-GCM", length: 256 },
    true,
    ["decrypt"]
  );
  let result: ArrayBuffer;
  try {
    result = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: hexToArray(dj.iv),
      },
      derived_key,
      hexToArray(dj.checksum)
    );
  } catch (e) {
    throw new Error("Incorrect key");
  }
  let dec = new TextDecoder();
  return dec.decode(result);
}
