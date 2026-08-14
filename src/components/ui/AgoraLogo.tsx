import Image from "next/image";

export function AgoraLogo({
  size = 32,
  variant = "color",
  className,
}: {
  size?: number;
  variant?: "color" | "white";
  className?: string;
}) {
  const src = variant === "white" ? "/logo-icon-white.png" : "/logo-icon-color.png";

  return (
    <Image
      src={src}
      alt="Agora"
      width={size}
      height={size}
      priority
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}
