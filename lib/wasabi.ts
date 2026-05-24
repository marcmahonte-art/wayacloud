import { S3Client } from "@aws-sdk/client-s3";

export function getWasabiClient() {
  return new S3Client({
    region: process.env.WASABI_REGION ?? "eu-central-1",
    endpoint: process.env.WASABI_ENDPOINT,
    credentials: {
      accessKeyId: process.env.WASABI_ACCESS_KEY ?? "",
      secretAccessKey: process.env.WASABI_SECRET_KEY ?? "",
    },
  });
}

export function getWasabiBucket(): string {
  return process.env.WASABI_BUCKET ?? "wayacloud-storage";
}
