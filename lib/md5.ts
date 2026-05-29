import { createHash } from "crypto";
import { createReadStream } from "fs";
import { stat } from "fs/promises";

export function hashMd5(buffer: Buffer): string {
  return createHash("md5").update(buffer).digest("hex");
}

export function hashMd5Stream(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("md5");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk: string | Buffer) => { if (typeof chunk !== "string") hash.update(chunk); });
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

export function hashMd5String(input: string): string {
  return createHash("md5").update(input, "utf-8").digest("hex");
}
