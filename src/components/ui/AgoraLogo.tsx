export function AgoraLogo({
  size = 32,
  variant = "color",
  className,
}: {
  size?: number;
  variant?: "color" | "white";
  className?: string;
}) {
  const white = variant === "white";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 300"
      width={size}
      height={size}
      className={className}
    >
      {!white && (
        <defs>
          <linearGradient
            id="agBlue"
            x1="0"
            y1="-70"
            x2="0"
            y2="70"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#487AD0" />
            <stop offset="100%" stopColor="#6B2C82" />
          </linearGradient>
          <linearGradient
            id="agMag"
            x1="0"
            y1="70"
            x2="0"
            y2="-70"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#8F0E55" />
            <stop offset="100%" stopColor="#6B2C82" />
          </linearGradient>
        </defs>
      )}

      <g transform="translate(150, 150)">
        {/* 8 nodos exteriores a R=65, cada 45° */}
        <circle cx="65"     cy="0"      r="10" fill={white ? "white" : "url(#agMag)"}  />
        <circle cx="45.96"  cy="45.96"  r="10" fill={white ? "white" : "url(#agMag)"}  />
        <circle cx="0"      cy="65"     r="10" fill={white ? "white" : "url(#agMag)"}  />
        <circle cx="-45.96" cy="45.96"  r="10" fill={white ? "white" : "url(#agBlue)"} />
        <circle cx="-65"    cy="0"      r="10" fill={white ? "white" : "url(#agBlue)"} />
        <circle cx="-45.96" cy="-45.96" r="10" fill={white ? "white" : "url(#agBlue)"} />
        <circle cx="0"      cy="-65"    r="10" fill={white ? "white" : "url(#agBlue)"} />
        <circle cx="45.96"  cy="-45.96" r="10" fill={white ? "white" : "url(#agMag)"}  />

        {/* Swoosh superior */}
        <g transform="rotate(-15)">
          <path
            d="M 12 -40 A 55 55 0 0 0 22 40 A 42 42 0 0 1 12 -40 Z"
            fill={white ? "white" : "url(#agBlue)"}
          />
        </g>

        {/* Swoosh inferior (opuesto 180°) */}
        <g transform="rotate(165)">
          <path
            d="M 12 -40 A 55 55 0 0 0 22 40 A 42 42 0 0 1 12 -40 Z"
            fill={white ? "rgba(255,255,255,0.75)" : "url(#agMag)"}
          />
        </g>
      </g>
    </svg>
  );
}
