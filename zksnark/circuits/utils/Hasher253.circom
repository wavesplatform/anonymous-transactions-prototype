include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/pedersen.circom";

template Hasher253() {
  signal input in;
  signal output out;

  component b_in = Num2Bits(253);
  component h_out = Pedersen(253);

  b_in.in <== in;

  for (var i=0; i<253; i++) {
    h_out.in[i] <== b_in.out[i];
  }

  component b_out1 = Num2Bits_strict();
  component b_out2 = Bits2Num(253);

  b_out1.in <== h_out.out[0];
  for (var i=0; i<253; i++) {
    b_out2.in[i] <== b_out1.out[i];
  }
  out <== b_out2.out;
}