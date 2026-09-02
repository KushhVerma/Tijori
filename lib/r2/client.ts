import "server-only"

import { S3Client } from "@aws-sdk/client-s3"

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and fill in your R2 credentials.`
    )
  }
  return value
}

let client: S3Client | null = null

// R2 speaks the S3 API, so the regular AWS SDK works against it — no
// Cloudflare-specific SDK needed.
export function getR2Client() {
  if (client) return client

  const accountId = required("R2_ACCOUNT_ID", process.env.R2_ACCOUNT_ID)

  client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: required("R2_ACCESS_KEY_ID", process.env.R2_ACCESS_KEY_ID),
      secretAccessKey: required("R2_SECRET_ACCESS_KEY", process.env.R2_SECRET_ACCESS_KEY),
    },
  })

  return client
}

export function getR2Bucket() {
  return required("R2_BUCKET", process.env.R2_BUCKET)
}
