include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/pedersen.circom";

template Compressor253() {
  signal input in[2];
  signal output out;
  component b_in[2];

  for(var i=0; i<2; i++) {
    b_in[i] = Num2Bits(253);
    b_in[i].in <== in[i];
  }
  component h_out = Pedersen(506);

  for (var i=0; i<253; i++) {
    h_out.in[i] <== b_in[0].out[i];
  }

  for (var i=0; i<253; i++) {
    h_out.in[253+i] <== b_in[1].out[i];
  }

  component b_out1 = Num2Bits_strict();
  component b_out2 = Bits2Num(253);

  b_out1.in <== h_out.out[0];
  for (var i=0; i<253; i++) {
    b_out2.in[i] <== b_out1.out[i];
  }
  out <== b_out2.out;
}
