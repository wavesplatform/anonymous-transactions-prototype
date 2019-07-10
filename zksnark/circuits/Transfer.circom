
include "./Utils.circom";
include "../node_modules/circomlib/circuits/comparators.circom";


template Transfer(N, C) {
  signal input in_hashes[N];
  
  signal input nullifier[2];
  signal input out_hash[2];
  signal private input index[2];
  
  signal private input balance[4];
  signal private input secret[4];

  signal private input pubkey;
  signal private input privkey;
  signal private input entropy;

  signal hashes[4];

  

  component in_hash[2];
  for (var i=0; i<2; i++) {
    in_hash[i] = Selector(N);
    in_hash[i].index <== index[i];
    for (var j=0; j<N; j++) {
      in_hash[i].in[j] <== in_hashes[j];
    }
  }

  for (var i=0; i<2; i++) {
    hashes[i] <== in_hash[i].out;
  }

  for (var i=0; i<2; i++) {
    hashes[2+i] <== out_hash[i];
  }

  component utxohash[4];

  for (var i=0; i<4; i++) {
    utxohash[i] = UTXOHasher();
    utxohash.balance <== balance[i];
    utxohash.pubkey <== pubkey;
    utxohash.secret <== secret[i];
    hashes[i] === utxohash[i].out;
  }

  component are_inputs_same = isZero();
  are_inputs_same.in <== hashes[0]-hashes[1];

  
  component cpubkey = PubKey();
  checkPreimage.in <== privkey;
  checkPreimage.out === pubkey;

  component cnullifier[2];

  for(var i=0; i<2; i++) {
    cnullifier[i] = Compressor();
    cnullifier[i].in[0] <== privkey;
    cnullifier[i].in[1] <== secret[i];
  }


  component replacement_nullifier = Compressor();
  replacement_nullifier.in[0] <== nullifier[0];
  replacement_nullifier.in[1] <== entropy;

  nullifier[0] === cnullifier[0].out;
  nullifier[1] === cnullifier[1].out + (replacement_nullifier.out - cnullifier[1].out) * are_inputs_same.out;

  balance[0] + balance[1] * (1 - are_inputs_same.out) === balance[2] + balance[3] + C;

}

component main = Transfer(16, 900000);