import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0E0E0E",
          color: "#FAFAF7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 38,
          fontWeight: 900,
          letterSpacing: "-2px",
          borderRadius: 12,
          fontFamily: "sans-serif",
        }}
      >
        MW
      </div>
    ),
    size,
  );
}
