const fetch = require("node-fetch");
const { fload, serializeProof, serializeVK, serializeInputs } = require("./utils.js");
const { groth, Circuit } = require("snarkjs");
const { broadcast, waitForTx, setScript, invokeScript } = require("@waves/waves-transactions");
const { address, base58Encode } = require("@waves/waves-crypto");



const env = process.env;
if (env.NODE_ENV !== 'production') {
  require('dotenv').load();
}


const circuit = new Circuit(fload("build/Test_compiled.json"));
const pk = fload("build/Test_pk.json");
const vk = fload("build/Test_vk.json");
const inputs = { result: 27, preimage: 3 };

const witness = circuit.calculateWitness(inputs);
const { proof, publicSignals } = groth.genProof(pk, witness);



const seed = env.MNEMONIC;
const rpc = env.WAVES_RPC;
const chainId = env.WAVES_CHAINID;
const dApp = address(env.MNEMONIC, chainId);

const ridescript = `
{-# STDLIB_VERSION 3 #-}
{-# CONTENT_TYPE DAPP #-}
{-# SCRIPT_TYPE ACCOUNT #-}

let vk = base58'${base58Encode(serializeVK(vk))}'

@Callable(i)
func zkTest(proof:ByteVector, v:ByteVector) = {
  if(!groth16verify(vk, proof, v)) then
    throw("Wrong zkSNARK proof!")
  else
    WriteSet([DataEntry("zk", true)])
}
`;

(async () => {
  let request = await fetch(`${env.WAVES_RPC}utils/script/compile`, { method: "POST", body: ridescript })
  const { script } = await request.json();
  let tx = setScript({ script, fee: 1400000, chainId: 'D' }, seed);
  await broadcast(tx, rpc);
  await waitForTx(tx.id, { apiBase: rpc });

  tx = invokeScript({
    dApp,
    chainId,
    call: {
      function: "zkTest",
      args: [{ type: "binary", value: serializeProof(proof).toString("base64") }, { type: "binary", value: serializeInputs(publicSignals).toString("base64") }]
    }, fee: 900000
  }, seed);
  await broadcast(tx, rpc);
  await waitForTx(tx.id, { apiBase: rpc });

  request = await fetch(`${env.WAVES_RPC}addresses/data/${dApp}/zk`, { method: "GET" })
  if ((await request.json()).value === true)
    console.log("zkSNARK proved ok");
  else
    console.log("Something is going wrong");
  process.exit();
})();