import type { BuildConfig } from "unbuild";

const result: BuildConfig = {
  entries: [{ input: "./src/index" }, { input: "./src/client-index" }],
  rollup: {
    emitCJS: true,
  },
  declaration: true,
};
export default result;
