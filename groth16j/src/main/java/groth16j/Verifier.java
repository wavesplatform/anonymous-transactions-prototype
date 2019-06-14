package groth16j;

import static groth16j.ByteUtil.*;
import java.math.BigInteger;

class VK {
  public BN128G1 alpha1;
  public BN128G2 beta2;
  public BN128G2 gamma2;
  public BN128G2 delta2;
  public BN128G1[] IC;

  public VK(BN128G1 _alpha1, BN128G2 _beta2, BN128G2 _gamma2, BN128G2 _delta2, BN128G1[] _IC){
    alpha1 = _alpha1;
    beta2 = _beta2;
    gamma2 = _gamma2;
    delta2 = _delta2;
    IC = _IC;
  }

  public static VK create(byte[] vk) {
    int wordlen = vk.length/32;
    int iclen = wordlen/2-7;

    BN128G1[] IC = new BN128G1[iclen];
    for(int i = 14; i < wordlen; i+=2) {
      IC[(i-14)/2] = parseBN128G1(vk, i);
    }
    return new VK(parseBN128G1(vk, 0), parseBN128G2(vk, 2), parseBN128G2(vk, 6), parseBN128G2(vk, 10), IC);

  }
}


class Proof {
  public BN128G1 A;
  public BN128G2 B;
  public BN128G1 C;

  public Proof(BN128G1 _A, BN128G2 _B, BN128G1 _C) {
    A=_A;
    B=_B;
    C=_C;
  }

  public static Proof create(byte[] proof) {
    return new Proof(parseBN128G1(proof, 0), parseBN128G2(proof, 2), parseBN128G1(proof, 6));
  }
}


public class Verifier {

  private static boolean prod4(BN128G1 a1, BN128G2 a2, BN128G1 b1, BN128G2 b2, BN128G1 c1, BN128G2 c2, BN128G1 d1, BN128G2 d2) {
    PairingCheck pc = PairingCheck.create();
    pc.addPair(a1, a2);
    pc.addPair(b1, b2);
    pc.addPair(c1, c2);
    pc.addPair(d1, d2);
    pc.run();
    return pc.result()==1;
  }


  private static boolean verify(VK vk, Proof proof, BigInteger[] input) {
    BN128<Fp> vk_x = vk.IC[0];
    for (int i=0; i<input.length; i++) 
      vk_x = vk_x.add(vk.IC[i+1].mul(input[i]));
    
    return prod4((BN128G1)proof.A.negate(), proof.B, vk.alpha1, vk.beta2, (BN128G1)vk_x, vk.gamma2, proof.C, vk.delta2);
  }

  public static boolean verify(byte[] _vk, byte[] _proof, byte[] _input) {
    if (_vk.length%64 !=0 || _proof.length!=256 || _input.length%32!=0 || (_vk.length / 64 - 8) != (_input.length / 32)) return false;

    VK vk = VK.create(_vk);
    Proof proof = Proof.create(_proof);
    
    int ilen = _input.length/32;
    BigInteger[] input = new BigInteger[ilen];
    for (int i=0; i<ilen; i++)
      input[i]=bytesToBigInteger(parseWord(_input, i));
    
    
    return verify(vk, proof, input);
  }
}