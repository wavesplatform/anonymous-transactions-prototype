include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/pedersen.circom";

template Compressor() {
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

  out <== h_out.out[0];
}