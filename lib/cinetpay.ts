import { createHmac, timingSafeEqual } from "crypto";

export function verifyCinetPaySignature(
  payload: string,
  signature: string,
): boolean {
  const secret = process.env.CINETPAY_SECRET_KEY ?? "";
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const received = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return (
    received.length === expectedBuffer.length &&
    timingSafeEqual(received, expectedBuffer)
  );
}
