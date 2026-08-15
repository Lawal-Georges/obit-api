export function OrbitRings() {
  return (
    <svg
      viewBox="0 0 640 640"
      aria-hidden="true"
      style={{
        position: "absolute",
        top: "-140px",
        right: "-160px",
        width: "560px",
        height: "560px",
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
        stroke="#22304955"
        strokeWidth="1"
        transform="rotate(-18 320 320)"
      />
      <ellipse
        cx="320"
        cy="320"
        rx="200"
        ry="200"
        fill="none"
        stroke="#22304966"
        strokeWidth="1"
        strokeDasharray="2 8"
      />
      <ellipse
        cx="320"
        cy="320"
        rx="150"
        ry="270"
        fill="none"
        stroke="#22304944"
        strokeWidth="1"
        transform="rotate(24 320 320)"
      />
      <circle cx="320" cy="320" r="5" fill="#5eead4" opacity="0.8" />
      <circle cx="562" cy="248" r="4" fill="#5eead4" opacity="0.75" />
      <circle cx="192" cy="500" r="4" fill="#f5a94e" opacity="0.7" />
      <circle cx="122" cy="240" r="3.5" fill="#b794f6" opacity="0.7" />
      <circle cx="452" cy="486" r="3.5" fill="#f76e6e" opacity="0.6" />
    </svg>
  );
}
