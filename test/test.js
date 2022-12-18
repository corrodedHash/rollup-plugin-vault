const test = require("ava");
const answerGenerator = require("..");
const { rollup } = require("rollup");
const path = require("node:path");
const os = require("node:os");
const { mkdtemp, rm } = require("node:fs/promises");
const { exec } = require("node:child_process");
const test_dir = __dirname;

test("Basic test", async (t) => {
  const bundle = await rollup({
    input: path.join(test_dir, "assets", "user.js"),
    plugins: [answerGenerator(path.join(test_dir, "assets", "answers.json"))],
  });

  let temppath;
  try {
    temppath = await mkdtemp(
      path.join(os.tmpdir(), "vault-ava-test-")
    );
  } catch (e) {
    console.error("Could not create tmp dir", e);
  }
  const output = await bundle.write({ dir: temppath });

  const child_promise = new Promise((resolve, reject) => {
    exec(`node ${path.join(temppath, "user.js")}`, (e, stdout, stderr) => {
      if (e !== null) {
        reject({ e, stdout, stderr });
        return;
      }
      resolve({ stdout, stderr });
    });
  });
  const child = await child_promise;
  t.is(child.stdout, "works\n");
  t.is(child.stderr, "Incorrect key\n");
  await rm(temppath, { recursive: true, force: true });
});
