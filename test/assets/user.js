import checksum from "virtual:checksum-test";

checksum.check("wrong").catch((e) => {
  console.warn("Incorrect key");
});
checksum.check("bla").then((v) => {
  console.log(v);
});
