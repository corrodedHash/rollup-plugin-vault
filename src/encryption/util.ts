export interface ResultChecksum {
  salt: string;
  iv: string;
  checksum: string;
}

export function hexToArray(hex: string) {
  const pair_matchings = hex.match(/.{1,2}/g);
  if (pair_matchings === null) {
    return new Uint8Array();
  }
  return new Uint8Array(pair_matchings.map((byte) => parseInt(byte, 16)));
}

export function buf2hex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
