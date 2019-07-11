include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/pedersen.circom";

template Hasher() {
  signal input in;
  signal output out;

  component b_in = Num2Bits(253);
  component h_out = Pedersen(253);

  b_in.in <== in;

  for (var i=0; i<253; i++) {
    h_out.in[i] <== b_in.out[i];
  }

  out <== h_out.out[0];
}
