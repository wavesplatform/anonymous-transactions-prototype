#!/usr/bin/env node

const version = require("./package").version;
const { address, base58Encode } = require("@waves/waves-crypto");
const { serializeVK, fload } = require("./src/utils.js");
const argv = require("yargs")
  .version(version)
  .usage(`zksnark <command> <options>
Key serializing comand
======================
-c or --circuit
  Filename of compiled circuit generated by cicrcom.

  `).alias("c", "circuit")
  .argv;



if (argv._[0].toLowerCase() == "serializevk") {
  console.log(JSON.stringify({ vk: base58Encode(serializeVK(fload(argv.circuit))) }));
}