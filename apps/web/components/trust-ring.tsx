/** Circular trust-score gauge (0–100). */
export function TrustRing({ value, size = 44, label }: { value: number; size?: number; label?: boolean }) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const color = value >= 70 ? "hsl(var(--success))" : value >= 40 ? "hsl(var(--accent))" : "hsl(var(--danger))";
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`امتیاز اعتماد ${value}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(Math.max(value, 0), 100) / 100)}
          style={{ transition: "stroke-dashoffset .8s ease" }}
        />
      </svg>
      {label !== false && <span className="absolute text-[11px] font-extrabold">{new Intl.NumberFormat("fa-IR").format(value)}</span>}
    </div>
  );
}
