import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** Shared social card: RollMap brand, kicker, big title, subtitle and optional pills. */
export function ogCard({
  kicker,
  title,
  subtitle,
  pills = [],
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  pills?: string[];
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #0f1117 0%, #1a1d27 100%)",
          color: "#e8eaf0",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 800 }}>
          <span>Roll</span>
          <span style={{ color: "#22d3a7" }}>Map</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#22d3a7", textTransform: "uppercase", letterSpacing: 3, marginBottom: 18 }}>
            {kicker}
          </div>
          <div style={{ display: "flex", fontSize: title.length > 40 ? 60 : 76, fontWeight: 800, lineHeight: 1.05 }}>
            {title}
          </div>
          {subtitle ? (
            <div style={{ display: "flex", fontSize: 32, color: "#9ca3b4", marginTop: 20 }}>{subtitle}</div>
          ) : null}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 14 }}>
            {pills.map((p) => (
              <div
                key={p}
                style={{
                  display: "flex",
                  fontSize: 26,
                  fontWeight: 700,
                  padding: "10px 22px",
                  borderRadius: 999,
                  background: p.startsWith("Verified") ? "#22d3a7" : "rgba(34,211,167,0.15)",
                  color: p.startsWith("Verified") ? "#0f1117" : "#22d3a7",
                }}
              >
                {p}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#22d3a7", fontWeight: 700 }}>rollmap.co</div>
        </div>
      </div>
    ),
    OG_SIZE
  );
}
