import "@/app/brand.css";

type BrandLogoProps = {
  variant?: "full" | "icon";
  className?: string;
  decorative?: boolean;
  eager?: boolean;
  priority?: boolean;
};

export function BrandLogo({ variant = "full", className = "", decorative = false, eager = false, priority = false }: BrandLogoProps) {
  const full = variant === "full";
  return <img
    className={`point-logo point-logo--${variant} ${className}`.trim()}
    src={full ? "/images/brand/point-logo-v2.webp" : "/images/brand/point-icon-v2.webp"}
    alt={decorative ? "" : "Point do Hambúrguer"}
    width={full ? 800 : 512}
    height={full ? 450 : 512}
    loading={eager || priority ? "eager" : "lazy"}
    decoding={priority ? "sync" : "async"}
    fetchPriority={priority ? "high" : undefined}
  />;
}
