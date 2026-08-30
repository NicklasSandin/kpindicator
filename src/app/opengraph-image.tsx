import { ImageResponse } from "next/og";

import { SITE } from "@/lib/seo";

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#FBF9F4";
const INK = "#211E17";
const MUTED = "#6B6355";
const SIGNAL = "#B4741F";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: SIGNAL,
              display: "flex",
            }}
          />
          {/* Satori requires an explicit display on any node with >1 child. */}
          <div style={{ display: "flex", fontSize: 30, color: INK, letterSpacing: -0.5 }}>
            <span>KP</span>
            <span style={{ color: SIGNAL }}>Indicator</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 84,
              lineHeight: 1.04,
              color: INK,
              letterSpacing: -2.5,
              maxWidth: 900,
              display: "flex",
            }}
          >
            Test what hits. Build what wins.
          </div>
          <div style={{ display: "flex", marginTop: 40 }}>
            <div style={{ width: 88, height: 3, background: SIGNAL, display: "flex" }} />
            <div style={{ flex: 1, height: 3, background: "#E0D9CB", display: "flex" }} />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 24,
            color: MUTED,
          }}
        >
          <div style={{ display: "flex", maxWidth: 720, lineHeight: 1.4 }}>
            Real landing pages, real traffic, a written go / no-go — before you
            spend on a build.
          </div>
          <div style={{ display: "flex", color: SIGNAL, letterSpacing: 2 }}>
            FROM $995
          </div>
        </div>
      </div>
    ),
    size,
  );
}
