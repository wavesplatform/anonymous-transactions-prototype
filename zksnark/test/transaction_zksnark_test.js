const assert = require("assert");
const {babyJub} = require("circomlib");
const {stringifyBigInts, unstringifyBigInts, rand256, proof, verify, hash253, UTXOhasher, compress} = require("../src/utils.js");

const P = babyJub.p;

describe("zkSNARK", ()=>{

  const createPrivkey = () => {
    let t = 0n;
    while(true) {
      t = rand256()%babyJub.subOrder;
      if ((babyJub.mulPointEscalar(babyJub.Base8, t)[0] < (1n<<253n))) return t
    }
  }


  const createTestUtxo = (_privkey, _balance, _entropy) => {
    const privkey = typeof(_privkey)!=="undefined" ? _privkey : createPrivkey();
    const balance = typeof(_balance)!=="undefined" ? _balance : rand256() % 1000000000n + 900000n;
    const entropy = typeof(_entropy)!=="undefined" ? _entropy : rand256() % (1n<<253n);
    const pubkey = babyJub.mulPointEscalar(babyJub.Base8, privkey)[0];
    const secret = hash253(entropy);
    const hash = UTXOhasher({balance, pubkey, secret});
    const nullifier = compress(privkey, secret);
    return {hash, balance, pubkey, entropy, secret, privkey, nullifier};
  };

  const getDepositInputs = ({hash, balance, pubkey, entropy}) => ({hash, balance, pubkey, entropy})


  const createTestTransfer2to2 = () => {
    const privkey = createPrivkey();
    const index = [Math.floor(Math.random()*8), 8+Math.floor(Math.random()*8)]
    const in_utxo = Array(16).fill(0).map((e,i)=>createTestUtxo((i==index[0]||i==index[1])?privkey: createPrivkey()));
    const transfer_balance = in_utxo[index[0]].balance+in_utxo[index[1]].balance - 900000n;
    const _out_balance1 = transfer_balance * BigInt(Math.floor(Math.random()*1000)) / 1000n;
    const out_balance = [_out_balance1, transfer_balance - _out_balance1];
    const out_utxo = Array(2).fill(0).map((e,i)=>createTestUtxo(createPrivkey(), out_balance[i]));
    const entropy = rand256() & ((1n<<253n)-1n);
    return {
      in_utxo,
      out_utxo,
      index,
      entropy,
      privkey
    }
  }

  const createTestTransfer1to2 = () => {
    const privkey = createPrivkey();
    const _index = Math.floor(Math.random()*16)
    const index = [_index, _index];
    const in_utxo = Array(16).fill(0).map((e,i)=>createTestUtxo((i==_index)?privkey: createPrivkey()));
    const transfer_balance = in_utxo[_index].balance - 900000n;
    const _out_balance1 = transfer_balance * BigInt(Math.floor(Math.random()*1000)) / 1000n;
    const out_balance = [_out_balance1, transfer_balance - _out_balance1];
    const out_utxo = Array(2).fill(0).map((e,i)=>createTestUtxo(createPrivkey(), out_balance[i]));
    const entropy = rand256() & ((1n<<253n)-1n);
    return {
      in_utxo,
      out_utxo,
      index,
      entropy,
      privkey
    }
  }

  const getTransferInputs = (t) => {
    const eq_inputs = (t.in_utxo[t.index[0]].hash==t.in_utxo[t.index[1]].hash);
    const in_hashes = t.in_utxo.map(e=>e.hash);
    const nullifier = eq_inputs ? [t.in_utxo[t.index[0]].nullifier, compress(t.privkey, t.entropy)] : t.index.map(i=>t.in_utxo[i].nullifier);
    const out_hash = t.out_utxo.map(e=>e.hash);
    const index = t.index.map(BigInt);
    const in_balance = t.index.map(i=>t.in_utxo[i].balance);
    const out_balance = t.out_utxo.map(e=>e.balance);
    const in_secret = t.index.map(i=>t.in_utxo[i].secret);
    const out_entropy = t.out_utxo.map(e=>e.entropy);
    const out_pubkey = t.out_utxo.map(e=>e.pubkey);
    const entropy = t.entropy;
    const privkey = t.privkey;
    return {in_hashes, index, nullifier, in_balance, in_secret, out_hash, out_balance, out_entropy, out_pubkey, privkey, entropy};
  }


  const createTestWithdrawal = () => {
    const index = Math.floor(Math.random()*16)
    const in_utxo = Array(16).fill(0).map(()=>createTestUtxo());
    const privkey = in_utxo[index].privkey;
    return {
      in_utxo,
      index,
      privkey
    }
  }

  const getWithdrawalInputs = (t) => {
    const in_hashes = t.in_utxo.map(e=>e.hash);
    const nullifier = t.in_utxo[t.index].nullifier;
    const receiver = rand256() % babyJub.p;
    const index = BigInt(t.index);
    const balance = t.in_utxo[t.index].balance;
    const secret = t.in_utxo[t.index].secret;
    const privkey = t.in_utxo[t.index].privkey;
    return {in_hashes, nullifier, receiver, index, balance, secret, privkey};
  }


  it("check verifier for valid proof for Deposit", async ()=>{
    const name = 'Deposit';
    const utxo = createTestUtxo();
    const inputs = getDepositInputs(utxo);
    const proofData = await proof(inputs, name);
    assert(verify(proofData, name), "Proof is invalid.");

  
  }).timeout(120000)


  it("check verifier for valid proof for Transfer 2to2", async ()=>{
    const name = 'Transfer';
    const tx = createTestTransfer2to2();
    const inputs = getTransferInputs(tx);
    const proofData = await proof(inputs, name);
    assert(verify(proofData, name), "Proof is invalid.")
  }).timeout(6000000)

  it("check verifier for valid proof for Transfer 1to2", async ()=>{
    const name = 'Transfer';
    const tx = createTestTransfer1to2();
    const inputs = getTransferInputs(tx);
  
    const proofData = await proof(inputs, name);
    assert(verify(proofData, name), "Proof is invalid.")
  }).timeout(6000000)
  
  it("check verifier for valid proof for Withdrawal", async ()=>{
    const name = 'Withdrawal';
    const tx = createTestWithdrawal();
    const inputs = getWithdrawalInputs(tx);
    const proofData = await proof(inputs, name);
    assert(verify(proofData, name), "Proof is invalid.")
  }).timeout(6000000)

  after(function() {
    process.exit();
  });
});