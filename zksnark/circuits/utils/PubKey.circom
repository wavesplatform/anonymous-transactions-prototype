include "../node_modules/circomlib/circuits/escalarmulfix.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

template PubKey() {
  signal input in;
  signal output out;

  var BASE = [
    17777552123799933955779906779655732241715742912184938656739573121738514868268,
    2626589144620713026669568689430873010625803728049924121243784502389097019475
  ];
  component ecmul = EscalarMulFix(253, BASE);
  component in_bits = Num2Bits(253);
  in_bits.in <== in;
  for (var i=0; i<251; i++) {
    ecmul.in[i] <== in_bits.out[i];
  }
  out <== ecmul.out[0];
}