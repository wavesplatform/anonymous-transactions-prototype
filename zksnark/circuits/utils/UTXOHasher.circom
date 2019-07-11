include "../../node_modules/circomlib/circuits/pedersen.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";

template UTXOHasher() {
  signal input balance;
  signal input pubkey;
  signal input secret;
  signal output out;

  component hasher = Pedersen(570);
  var cur = 0;
  var i;

  component b_balance = Num2Bits(64);
  b_balance.in <== balance;
  for (i = 0; i<64; i++) {
    hasher.in[cur] <== b_balance.out[i];
    cur+=1;
  }

  component b_pubkey = Num2Bits(253);
  b_pubkey.in <== pubkey;
  for (i = 0; i<253; i++) {
    hasher.in[cur] <== b_pubkey.out[i];
    cur+=1;
  }

  component b_secret = Num2Bits(253);
  b_pubkey.in <== pubkey;
  for (i = 0; i<253; i++) {
    hasher.in[cur] <== b_pubkey.out[i];
    cur+=1;
  }

  out <== hasher.out[0];

}