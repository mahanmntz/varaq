import { AVATAR_COUNT } from "@varaq/shared";
import { cn } from "@/lib/utils";

type Hair = "short" | "long" | "bun" | "curly" | "cap" | "bald" | "bob" | "scarf";
type Def = { bg: string; skin: string; hair: string; style: Hair; glasses?: boolean };

/** 16 minimalist, bias-free illustrated avatars. Users pick one; no photo uploads. */
const AVATARS: Def[] = [
  { bg: "#f3d9b1", skin: "#e8b48a", hair: "#2b2118", style: "short" },
  { bg: "#cfe3d6", skin: "#c98f68", hair: "#1c1713", style: "long" },
  { bg: "#d8d3ee", skin: "#f1c9a5", hair: "#7a4a2a", style: "bun" },
  { bg: "#f2c9c2", skin: "#8d5a3b", hair: "#15110e", style: "curly" },
  { bg: "#c8dcec", skin: "#e8b48a", hair: "#3a4a63", style: "cap" },
  { bg: "#efe2a8", skin: "#a8714b", hair: "#1c1713", style: "bald", glasses: true },
  { bg: "#e5cfe0", skin: "#f1c9a5", hair: "#b5532e", style: "bob" },
  { bg: "#cde5e3", skin: "#d39c78", hair: "#2f6d62", style: "scarf" },
  { bg: "#f5d3a8", skin: "#8d5a3b", hair: "#15110e", style: "short", glasses: true },
  { bg: "#d4dcc0", skin: "#f1c9a5", hair: "#c9a14a", style: "long" },
  { bg: "#e9c4cf", skin: "#c98f68", hair: "#3a2a22", style: "bun", glasses: true },
  { bg: "#c3d0ea", skin: "#e8b48a", hair: "#15110e", style: "curly" },
  { bg: "#f0dcc0", skin: "#a8714b", hair: "#7a4a2a", style: "cap" },
  { bg: "#d9e8c9", skin: "#f1c9a5", hair: "#2b2118", style: "bob", glasses: true },
  { bg: "#e8d1c7", skin: "#8d5a3b", hair: "#b5532e", style: "scarf" },
  { bg: "#cfd8dc", skin: "#d39c78", hair: "#9aa3ab", style: "short" },
];

function HairBack({ style, color }: { style: Hair; color: string }) {
  if (style === "long") return <path d="M22 44c0-16 8-24 18-24s18 8 18 24v22H22z" fill={color} />;
  if (style === "bob") return <path d="M23 46c0-15 7-23 17-23s17 8 17 23v10H23z" fill={color} />;
  if (style === "bun") return <circle cx="40" cy="17" r="7" fill={color} />;
  if (style === "scarf") return <path d="M20 44c0-17 9-25 20-25s20 8 20 25v6H20z" fill={color} />;
  return null;
}
function HairFront({ style, color }: { style: Hair; color: string }) {
  switch (style) {
    case "short":
      return <path d="M27 38c0-10 5-16 13-16s13 6 13 16c-4-5-9-7-13-7s-9 2-13 7z" fill={color} />;
    case "curly":
      return (
        <g fill={color}>
          {[28, 34, 40, 46, 52].map((x, i) => (
            <circle key={x} cx={x} cy={i % 2 ? 25 : 28} r="6.5" />
          ))}
        </g>
      );
    case "cap":
      return <path d="M26 36c0-11 6-17 14-17s14 6 14 17z M26 36h34v3H26z" fill={color} />;
    case "long":
    case "bob":
      return <path d="M27 40c0-9 5-15 13-15s13 6 13 15c-5-3-9-7-13-7s-8 4-13 7z" fill={color} />;
    case "bun":
      return <path d="M28 38c0-9 5-14 12-14s12 5 12 14c-4-4-8-6-12-6s-8 2-12 6z" fill={color} />;
    case "scarf":
      return <path d="M26 42c0-12 6-19 14-19s14 7 14 19c-5-6-9-9-14-9s-9 3-14 9z" fill={color} />;
    default:
      return null;
  }
}

export function Avatar({ id, size = 40, className }: { id: number; size?: number; className?: string }) {
  const def = AVATARS[(Math.min(Math.max(id, 1), AVATAR_COUNT) - 1) % AVATAR_COUNT];
  return (
    <svg
      viewBox="0 0 80 80"
      width={size}
      height={size}
      className={cn("shrink-0 rounded-full", className)}
      role="img"
      aria-label={`آواتار ${id}`}
    >
      <rect width="80" height="80" fill={def.bg} />
      <HairBack style={def.style} color={def.hair} />
      <path d="M12 80c0-14 12-22 28-22s28 8 28 22z" fill={def.style === "scarf" ? def.hair : "#3d4a63"} opacity="0.9" />
      <rect x="35" y="50" width="10" height="10" rx="4" fill={def.skin} />
      <ellipse cx="40" cy="40" rx="13" ry="15" fill={def.skin} />
      <HairFront style={def.style} color={def.hair} />
      <circle cx="35" cy="41" r="1.5" fill="#1c1713" />
      <circle cx="45" cy="41" r="1.5" fill="#1c1713" />
      <path d="M36 48q4 3 8 0" stroke="#1c1713" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {def.glasses && (
        <g stroke="#1c1713" strokeWidth="1.4" fill="none">
          <circle cx="35" cy="41" r="4.5" />
          <circle cx="45" cy="41" r="4.5" />
          <path d="M39.5 41h1" />
        </g>
      )}
    </svg>
  );
}

export function AvatarPicker({ value, onChange }: { value?: number; onChange: (id: number) => void }) {
  return (
    <div className="grid grid-cols-4 gap-3" role="radiogroup" aria-label="انتخاب آواتار">
      {Array.from({ length: AVATAR_COUNT }, (_, i) => i + 1).map((id) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          onClick={() => onChange(id)}
          className={cn(
            "rounded-full p-1 transition",
            value === id ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : "opacity-80 hover:opacity-100",
          )}
        >
          <Avatar id={id} size={64} className="h-auto w-full" />
        </button>
      ))}
    </div>
  );
}
