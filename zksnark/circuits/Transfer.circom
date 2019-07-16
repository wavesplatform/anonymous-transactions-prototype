
include "./utils/Hasher253.circom";
include "./utils/UTXOHasher.circom";
include "./utils/PubKey.circom";
include "./utils/Compressor.circom";
include "./utils/Selector.circom";

include "../node_modules/circomlib/circuits/comparators.circom";


template Transfer(N, C) {
  signal input in_hashes[N];
  signal private input index[2];

  signal input nullifier[2];
  signal private input in_balance[2];
  signal private input in_secret[2];

  signal input out_hash[2];
  signal private input out_balance[2];
  signal private input out_entropy[2];
  signal private input out_pubkey[2];

  signal private input privkey;
  signal private input entropy;

  component csecret[2];
  for (var i=0;i<2;i++) {
    csecret[i] = Hasher253();
    csecret[i].in <== out_entropy[i];
  }  

  component in_hash[2];
  for (var i=0; i<2; i++) {
    in_hash[i] = Selector(N);
    in_hash[i].index <== index[i];
    for (var j=0; j<N; j++) {
      in_hash[i].in[j] <== in_hashes[j];
    }
  }

  component in_pubkey = PubKey();
  in_pubkey.in <== privkey;

  component utxohash[4];

  for (var i=0; i<4; i++) {
    utxohash[i] = UTXOHasher();
    if (i<2) {
      utxohash[i].balance <== in_balance[i];
      utxohash[i].pubkey <== in_pubkey.out;
      utxohash[i].secret <== in_secret[i];
      utxohash[i].out === in_hash[i].out;
    }
    else {
      utxohash[i].balance <== out_balance[i-2];
      utxohash[i].pubkey <== out_pubkey[i-2];
      utxohash[i].secret <== csecret[i-2].out;
      utxohash[i].out === out_hash[i-2];
    }
  }

  component are_inputs_same = IsZero();
  are_inputs_same.in <== in_hash[0].out-in_hash[1].out;

  


  component cnullifier[2];

  for(var i=0; i<2; i++) {
    cnullifier[i] = Compressor();
    cnullifier[i].in[0] <== privkey;
    cnullifier[i].in[1] <== in_secret[i];
  }


  component replacement_nullifier = Compressor();
  replacement_nullifier.in[0] <== privkey;
  replacement_nullifier.in[1] <== entropy;

  nullifier[0] === cnullifier[0].out;
  nullifier[1] === cnullifier[1].out + (replacement_nullifier.out - cnullifier[1].out) * are_inputs_same.out;

  in_balance[0] + in_balance[1] * (1 - are_inputs_same.out) === out_balance[0] + out_balance[1] + C;

}

component main = Transfer(16, 900000);