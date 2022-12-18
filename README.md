[npm]: https://img.shields.io/npm/v/rollup-plugin-vault
[npm-url]: https://www.npmjs.com/package/rollup-plugin-vault
[size]: https://packagephobia.now.sh/badge?p=rollup-plugin-vault
[size-url]: https://packagephobia.now.sh/result?p=rollup-plugin-vault

[![npm][npm]][npm-url]
[![size][size]][size-url]

# rollup-plugin-vault

🔒 Encrypts text at build time, to be decrypted at runtime 🔒

## Install

Using npm:

```bash
npm install rollup-plugin-vault --save-dev
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```js
import vault from "rollup-plugin-vault";

export default {
  input: "src/index.ts",
  plugins: [vault("answers.json")],
};
```

And in `index.ts`

```ts
import checksum from "virtual:checksum-first-vault-entry";
checksum.check("Incorrect").catch((e) => console.log("Did not work"));
checksum.check("secret").then((v) => console.log("Decrypted", v));
```

with an `answers.json`

```json
{
  "first-vault-entry": {
    "key": "secret",
    "result": "This is the decrypted cleartext"
  }
}
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api).
