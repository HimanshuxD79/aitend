import "server-only";
import { StreamClient } from "@stream-io/node-sdk";

const apiKey = process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY;
const secretKey = process.env.STREAM_VIDEO_SECRET_KEY;

if (!apiKey || !secretKey) {
  throw new Error("Stream Video API credentials are missing");
}

export const streamVideo = new StreamClient(apiKey, secretKey);
