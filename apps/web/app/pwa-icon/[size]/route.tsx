import { ImageResponse } from "next/og";

/** Renders the app icon (an open book in ink on paper) at any requested square size. */
export async function GET(_req: Request, ctx: { params: Promise<{ size: string }> }) {
  const size = Math.min(Math.max(Number((await ctx.params).size) || 192, 48), 1024);
  const u = size / 100;
  return new ImageResponse(
    <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: "#2a3350" }}>
      <div style={{ display: "flex", gap: 3 * u }}>
        <div
          style={{ width: 22 * u, height: 30 * u, background: "#faf6ee", borderRadius: `${4 * u}px ${1 * u}px ${1 * u}px ${4 * u}px` }}
        />
        <div
          style={{ width: 22 * u, height: 30 * u, background: "#d9825b", borderRadius: `${1 * u}px ${4 * u}px ${4 * u}px ${1 * u}px` }}
        />
      </div>
    </div>,
    { width: size, height: size },
  );
}
