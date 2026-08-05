import { ImageResponse } from "next/og";

export const alt = "Ledger — Get out of debt, simply and smartly";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          color: "#ffffff",
          backgroundColor: "#0b0b0f",
          backgroundImage:
            "radial-gradient(900px 520px at 82% -12%, rgba(99,102,241,0.42), transparent 60%), radial-gradient(760px 460px at 8% 118%, rgba(52,211,153,0.30), transparent 60%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              backgroundImage: "linear-gradient(135deg, #818cf8, #34d399)",
            }}
          />
          <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>
            Ledger
          </span>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 74,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 940,
            }}
          >
            Get out of debt, simply and smartly.
          </div>
          <div
            style={{
              fontSize: 30,
              color: "#a1a1aa",
              marginTop: 26,
              maxWidth: 860,
              lineHeight: 1.4,
            }}
          >
            Your debt-free date, avalanche vs. snowball, and every payment
            tracked — private and free to start.
          </div>
        </div>

        {/* footer chips */}
        <div style={{ display: "flex", gap: 12 }}>
          {["Avalanche & Snowball", "Debt-free date", "Track every payment"].map(
            (t) => (
              <div
                key={t}
                style={{
                  display: "flex",
                  fontSize: 22,
                  color: "#e7e7ea",
                  border: "1px solid rgba(255,255,255,0.16)",
                  borderRadius: 999,
                  padding: "10px 20px",
                }}
              >
                {t}
              </div>
            ),
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
