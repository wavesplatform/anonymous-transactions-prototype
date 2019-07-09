
include "./Utils.circom";
include "../circomlib/circuits/comparators.circom";


template Transfer(N, C) {
  signal input in_hashes[N];
  
  signal input nullifier[2];
  signal input out_hash[2];
  signal private input index[2];
  
  signal private input balance[4];
  signal private input secret[4];

  signal private input owner;
  signal private input owner_preimage;
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
    utxohash.owner <== owner[i];
    utxohash.secret <== secret[i];
    hashes[i] === utxohash[i].out;
  }

  component is_inputs_same = isZero();
  is_inputs_same.in <== hashes[0]-hashes[1];

  
  component checkPreimage = Hasher();
  checkPreimage.in <== owner_preimage;
  checkPreimage.out === owner;

  component cnullifier[2];

  for(var i=0; i<2; i++) {
    cnullifier[i] = Compressor();
    cnullifier[i].in[0] <== owner_preimage;
    cnullifier[i].in[1] <== secret[i];
  }


  component replacement_nullifier = Compressor();
  replacement_nullifier.in[0] <== nullifier[0];
  replacement_nullifier.in[1] <== entropy;

  nullifier[0] === cnullifier[0].out;
  nullifier[1] === cnullifier[1].out + (replacement_nullifier.out - cnullifier[1].out) * is_inputs_same.out;

  balance[0] + balance[1] * (1 - is_inputs_same.out) === balance[2] + balance[3] + C;

}

component main = Transfer(16, 900000);