include "../circomlib/circuits/pedersen.circom";
include "../circomlib/circuits/bitify.circom";

template UTXOHasher() {
  signal input balance;
  signal input salt
  signal input owner;
  signal input secret;
  signal output hash;

  component hasher = Pedersen(512);
  var cur = 0;
  var i;

  component b_balance = Num2Bits(64);
  b_balance.in <== balance;
  for (i = 0; i<64; i++) {
    hasher.in[cur] <== b_balance.out[i];
    cur+=1;
  }

  component b_owner = Num2Bits(208);
  b_owner.in <== owner;
  for (i = 0; i<208; i++) {
    hasher.in[cur] <== b_owner.out[i];
    cur+=1;
  }

  component b_secret = Num2Bits(160);
  b_secret.in <== secret;
  for (i = 0; i<160; i++) {
    hasher.in[cur] <== b_secret.out[i];
    cur+=1;
  }

  component b_salt = Num2Bits(80);
  b_salt.in <== salt;
  for (i = 0; i<80; i++) {
    hasher.in[cur] <== b_salt.out[i];
    cur+=1;
  }

  hash <== hasher.out[0];

}