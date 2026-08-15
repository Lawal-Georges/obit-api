export function OrbitRings() {
  return (
    <svg
      viewBox="0 0 640 640"
      aria-hidden="true"
      style={{
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity: 0.9,
      }}
    >
      <ellipse
        cx="320"
        cy="320"
        rx="260"
        ry="140"
        fill="none"
        stroke="var(--ring-1)"
        strokeWidth="1"
        transform="rotate(-18 320 320)"
      />
      <ellipse
        cx="320"
        cy="320"
        rx="200"
        ry="200"
        fill="none"
        stroke="var(--ring-2)"
        strokeWidth="1"
        strokeDasharray="2 8"
      />
      <ellipse
        cx="320"
        cy="320"
        rx="150"
        ry="270"
        fill="none"
        stroke="var(--ring-3)"
        strokeWidth="1"
        transform="rotate(24 320 320)"
      />
      <circle cx="320" cy="320" r="5" fill="var(--get)" opacity="0.8" />
      <circle cx="562" cy="248" r="4" fill="var(--get)" opacity="0.75" />
      <circle cx="192" cy="500" r="4" fill="var(--post)" opacity="0.7" />
      <circle cx="122" cy="240" r="3.5" fill="var(--patch)" opacity="0.7" />
      <circle cx="452" cy="486" r="3.5" fill="var(--delete)" opacity="0.6" />
    </svg>
  );
}
