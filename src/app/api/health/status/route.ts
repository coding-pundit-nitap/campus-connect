import { jsonResponse } from "@/lib/serializers/response-serializer";

export async function GET() {
  return jsonResponse({ status: "healthy" }, 200);
}

export async function HEAD() {
  return jsonResponse(null, 200);
}
