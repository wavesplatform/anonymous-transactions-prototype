/*
 * Copyright (c) [2016] [ <ether.camp> ]
 * This file is part of the ethereumJ library.
 *
 * The ethereumJ library is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * The ethereumJ library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with the ethereumJ library. If not, see <http://www.gnu.org/licenses/>.
 */

package groth16j;

import java.math.BigInteger;

public class ByteUtil {
  public static final byte[] EMPTY_BYTE_ARRAY = new byte[0];
  public static final byte[] ZERO_BYTE_ARRAY = new byte[]{0};

  public static byte[] parseBytes(byte[] input, int offset, int len) {

    if (offset >= input.length || len == 0)
        return EMPTY_BYTE_ARRAY;

    byte[] bytes = new byte[len];
    System.arraycopy(input, offset, bytes, 0, Math.min(input.length - offset, len));
    return bytes;
  }

  public static byte[] bigIntegerToBytes(BigInteger b, int numBytes) {
    if (b == null)
        return null;
    byte[] bytes = new byte[numBytes];
    byte[] biBytes = b.toByteArray();
    int start = (biBytes.length == numBytes + 1) ? 1 : 0;
    int length = Math.min(biBytes.length, numBytes);
    System.arraycopy(biBytes, start, bytes, numBytes - length, length);
    return bytes;
}

  public static byte[] parseWord(byte[] input, int idx) {
    return parseBytes(input, 32 * idx, 32);
  }

  public static BigInteger bytesToBigInteger(byte[] bb) {
    return (bb == null || bb.length == 0) ? BigInteger.ZERO : new BigInteger(1, bb);
  }

  public static BN128G1 parseBN128G1(byte[] input, int idx) {
    return BN128G1.create(parseWord(input, idx), parseWord(input, idx+1));
  }

  public static BN128G2 parseBN128G2(byte[] input, int idx) {
    return BN128G2.create(parseWord(input, idx), parseWord(input, idx+1), parseWord(input, idx+2), parseWord(input, idx+3));
  }



}