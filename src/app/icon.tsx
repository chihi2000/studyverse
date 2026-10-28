import { ImageResponse } from "next/og";

// App icons for the manifest and notifications, served at /icon/192 and /icon/512.
export function generateImageMetadata() {
  return [192, 512].map((size) => ({ id: String(size), size: { width: size, height: size }, contentType: "image/png" }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const size = Number(await id);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#193d35",
          color: "#f7f5ef",
          fontSize: size * 0.6,
          fontWeight: 700,
        }}
      >
        S
      </div>
    ),
    { width: size, height: size },
  );
}
