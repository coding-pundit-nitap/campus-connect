import { MetadataRoute } from "next";

export default function opengraphImage() {
  return new Response(null, {
    status: 307,
    headers: {
      Location: "/og-image.png",
    },
  });
}

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
