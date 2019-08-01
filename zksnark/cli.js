#!/usr/bin/env node

const version = require("./package").version;
const { address, base58Encode } = require("@waves/waves-crypto");
const { serializeVK, serializeProof, serializeInputs, fload, proof, createUtxo, getDepositInputs, getmsg, postmsg, stringifyBigInts,
  createTransfer, createWithdrawal, getTransferInputs, getWithdrawalInputs } = require("./src/utils.js");



const api = {
  serializeVK: circuit=>base58Encode(serializeVK(fload(circuit))),
  utxoCompute: msg=>createUtxo(msg),
  utxoComputeMany: msg => msg.map(createUtxo),
  depositProof: async utxo => {
    const inputs = getDepositInputs(utxo);
    const proofData = await proof(inputs, 'Deposit');
    return {
      proof:serializeProof(proofData.proof).toString("base64"),
      inputs:serializeInputs(proofData.publicSignals.slice(0, -1)).toString("base64")
    }
  },
  withdrawalProof: async withdrawal => {
    const inputs  = getWithdrawalInputs(withdrawal)
    const proofData = await proof(inputs, 'Withdrawal');
    return {
      proof:serializeProof(proofData.proof).toString("base64"),
      inputs:serializeInputs(proofData.publicSignals).toString("base64")
    }
  },
  transferProof: async transfer => {
    const inputs  = getTransferInputs(transfer)
    const proofData = await proof(inputs, 'Transfer');
    return {
      proof:serializeProof(proofData.proof).toString("base64"),
      inputs:serializeInputs(proofData.publicSignals).toString("base64")
    }
  }

}

process.stdin.resume();
process.stdin.setEncoding('utf8');

(async ()=>{
  const {rpc, params} = await getmsg();
  if (rpc in api) {
    postmsg(await api[rpc](...params));
  } else throw (`Bad rpc call: ${rpc}`);
  process.exit();
})();


