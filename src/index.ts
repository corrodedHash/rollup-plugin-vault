import { readFile } from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
import { encode_pls } from "./encryption/enc";
import type { Plugin } from "rollup";

type AnswerEntry = { key: string } & (
  | {
      result: string;
    }
  | {
      result_path: string;
    }
);

function isAnswerEntry(entry: any): entry is AnswerEntry {
  const assertProperty = (condition: boolean, message?: string) => {
    if (!condition) throw new Error(message);
  };

  assertProperty(typeof entry === "object", "Not an object");
  assertProperty("key" in entry, "No key");
  assertProperty(
    "result" in entry || "result_path" in entry,
    "Neither result nor result_path"
  );
  assertProperty(
    "result" in entry != "result_path" in entry,
    "Only specify either result or result_path"
  );
  assertProperty(
    typeof entry["key"] === "string",
    `Key is not a string, but ${typeof entry["key"]}`
  );
  assertProperty(
    !("result" in entry) || typeof entry["result"] === "string",
    "Result must be a string"
  );
  assertProperty(
    !("result_path" in entry) || typeof entry["result_path"] === "string",
    "result_path must be a string"
  );

  return true;
}

/**
 * Create encrypted datafields by importing the virtual module 'virtual:checksum-\<answername\>', where answername is a key in a provided .json file.
 * The default export then provides a function `check`, which takes a string and returns a Promise, which either returns the original string provided
 * in the answer json, or throws an error.
 * The schema of the answer json file is {"\<answername\>": {"key": "\<password\>", "result": "\<value returned by successful `check`\>"}}.
 * Optionally, a `result_path` key can be provided instead of a `result` key, which resolves the result from the file path.
 * @param answer_file_path The path to the json file which contains the answers. Default: 'answers.json'
 */
export default function answerChecksumGenerator(
  answer_file_path?: string
): Plugin {
  const virtualModuleIdRegex = /^virtual:checksum-(?<answername>.*)$/;
  const prefix = "\0" + "answer-plugin-parsed-";
  const hashcheck_module_call = "virtual:answer-plugin-hashcheck-module";
  const file_path = answer_file_path || "answers.json";

  const hashcheck_module_path = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "client-index"
  );

  return {
    name: "answer-checksum-generator",
    async resolveId(id, importer, options) {
      if (id === hashcheck_module_call) {
        let resolved_hashcheck_module = await this.resolve(
          hashcheck_module_path
        );
        if (resolved_hashcheck_module === null)
          throw new Error(
            `Could not resolve hashcheck module at ${hashcheck_module_path}`
          );
        return { id: resolved_hashcheck_module.id };
      }
      const a = virtualModuleIdRegex.exec(id);
      if (a === null) return;
      if (a.groups === undefined) throw new Error("Regex group is undefined");
      if (a.groups["answername"] === undefined)
        throw new Error("Could not find answername");
      const answername = a.groups["answername"];
      return prefix + answername;
    },
    async load(id) {
      if (!id.startsWith(prefix)) return;
      const parsed_id = id.substring(prefix.length);

      const read_answers = await readFile(file_path, {
        encoding: "utf-8",
      });

      this.addWatchFile(file_path);
      const parsed_answers = JSON.parse(read_answers);
      const answer = parsed_answers[parsed_id];
      try {
        if (!isAnswerEntry(answer)) throw new Error("Not an answer");
      } catch (e) {
        throw new Error(`Parsing ${parsed_id} from ${file_path}: ${e}`);
      }

      let result_str = "";
      if ("result_path" in answer) {
        result_str = await readFile(answer.result_path, {
          encoding: "utf-8",
        });
        this.addWatchFile(answer.result_path);
      } else {
        result_str = answer.result;
      }

      const enc_answer = await encode_pls({
        key: answer.key,
        result: result_str,
      });
      const enc_answer_string = JSON.stringify(enc_answer);

      return `import {check_static} from '${hashcheck_module_call}';
      const result = ${enc_answer_string};
      result.check = async function(value) {
        try {
          return await check_static(value, this)
        } catch (e) {throw e}
      };
      export default result;`;
    },
  };
}
