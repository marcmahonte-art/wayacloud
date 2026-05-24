"use client";

import { Upload } from "tus-js-client";

interface TusUploadOptions {
  endpoint: string;
  file: File;
  metadata: Record<string, string>;
  onProgress(progress: number): void;
}

export function uploadWithTus({
  endpoint,
  file,
  metadata,
  onProgress,
}: TusUploadOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint,
      metadata,
      retryDelays: [0, 1000, 3000, 5000],
      onError(error) {
        reject(error);
      },
      onProgress(bytesUploaded, bytesTotal) {
        const progress = bytesTotal > 0 ? (bytesUploaded / bytesTotal) * 100 : 0;
        onProgress(Math.round(progress));
      },
      onSuccess() {
        resolve(upload.url ?? "");
      },
    });

    upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length > 0) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }
      upload.start();
    });
  });
}
