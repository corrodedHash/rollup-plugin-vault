import { check_static } from "./dec";
import { buf2hex, hexToArray, ResultChecksum } from "./util";

async function make_static(
  key: string,
  salt: string,
  iv: string,
  message: string
) {
  let enc = new TextEncoder();

  let encoded_key = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  let derived_key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: hexToArray(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    encoded_key,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  let result = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: hexToArray(iv),
    },
    derived_key,
    enc.encode(message)
  );

  return result;
}

export async function encode_pls({
  key,
  result,
}: {
  key: any;
  result: any;
}): Promise<ResultChecksum> {
  if (key === undefined || result === undefined) {
    throw new Error("Could not read answer json");
  }
  const salt = buf2hex(crypto.getRandomValues(new Uint8Array(16)));
  const iv = buf2hex(crypto.getRandomValues(new Uint8Array(12)));
  const encrypted = buf2hex(await make_static(key, salt, iv, result));
  const decrypted = await check_static(key, {
    salt: salt,
    iv: iv,
    checksum: encrypted,
  });
  if (result !== decrypted) {
    throw new Error(`Encrypted incorrectly: ${result}, ${decrypted}`);
  }
  const rjson = { salt: salt, iv: iv, checksum: encrypted };
  return rjson;
}
