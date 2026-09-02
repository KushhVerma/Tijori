import "server-only"

import { randomUUID } from "node:crypto"

import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import { getR2Bucket, getR2Client } from "@/lib/r2/client"

const UPLOAD_URL_TTL_SECONDS = 60 * 5
const READ_URL_TTL_SECONDS = 60 * 60

export function buildMediaKey(userId: string, itemId: string, extension: string) {
  return `${userId}/${itemId}/original.${extension}`
}

export function buildThumbnailKey(userId: string, itemId: string, extension: string) {
  return `${userId}/${itemId}/thumb.${extension}`
}

/**
 * Issues a short-lived, direct-to-R2 upload URL so file bytes never pass
 * through the Next.js server. The browser PUTs straight to this URL, then
 * confirms the upload by creating/updating the item via the normal API.
 */
export async function createUploadUrl(key: string, contentType: string) {
  const client = getR2Client()
  const command = new PutObjectCommand({
    Bucket: getR2Bucket(),
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(client, command, { expiresIn: UPLOAD_URL_TTL_SECONDS })
}

/**
 * Issues a short-lived read URL for a stored object. Used when no public
 * R2_PUBLIC_URL custom domain is configured.
 */
export async function createReadUrl(key: string) {
  const client = getR2Client()
  const command = new GetObjectCommand({ Bucket: getR2Bucket(), Key: key })

  return getSignedUrl(client, command, { expiresIn: READ_URL_TTL_SECONDS })
}

export function newObjectId() {
  return randomUUID()
}
