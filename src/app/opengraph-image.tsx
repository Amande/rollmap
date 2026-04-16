import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "RollMap — Find BJJ gyms to train, anywhere.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #111318 0%, #1a1d24 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <span style={{ fontSize: 64, fontWeight: 800, color: "#ffffff" }}>
            Roll
          </span>
          <span style={{ fontSize: 64, fontWeight: 800, color: "#4ade80" }}>
            Map
          </span>
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: "#ffffff",
            marginBottom: 16,
          }}
        >
          Find your next roll.
        </div>
        <div
          style={{
            fontSize: 22,
            color: "#9ca3af",
            marginBottom: 40,
          }}
        >
          10,000+ BJJ gyms worldwide
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
          }}
        >
          {["Gi", "No-Gi", "Open Mat", "Drop-in"].map((tag) => (
            <div
              key={tag}
              style={{
                background: "rgba(74, 222, 128, 0.15)",
                color: "#4ade80",
                padding: "8px 20px",
                borderRadius: 20,
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 30,
            fontSize: 18,
            color: "#6b7280",
          }}
        >
          rollmap.co
        </div>
      </div>
    ),
    { ...size }
  );
}
