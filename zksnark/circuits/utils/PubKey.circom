include "../../node_modules/circomlib/circuits/escalarmulfix.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/compconstant.circom";


template PubKey() {
  signal input in;
  signal output out;

  var BASE = [
    17777552123799933955779906779655732241715742912184938656739573121738514868268,
    2626589144620713026669568689430873010625803728049924121243784502389097019475
  ];
  
  component compConstant = CompConstant(2736030358979909402780800718157159386076813972158567259200215660948447373040);
  component ecmul = EscalarMulFix(253, BASE);
  component in_bits = Num2Bits(253);
  in_bits.in <== in;
  for (var i=0; i<253; i++) {
    ecmul.e[i] <== in_bits.out[i];
    compConstant.in[i] <== in_bits.out[i];
  }
  compConstant.in[253]<==0;
  compConstant.out === 0;
  out <== ecmul.out[0];
}