import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/**
 * Square brand mark. Doubles as the schema.org Organization logo, which is
 * why it is 512px rather than favicon-sized — Google wants a logo it can
 * render in a knowledge panel, not a 32px favicon.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#211E17",
        }}
      >
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: 999,
            background: "#D08A28",
            display: "flex",
          }}
        />
      </div>
    ),
    size,
  );
}
