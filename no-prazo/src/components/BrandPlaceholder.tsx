import Image from "next/image";

type BrandPlaceholderProps = {
  label: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "soft";
};

export function BrandPlaceholder({
  label,
  size = "md",
  variant = "primary",
}: BrandPlaceholderProps) {
  return (
    <div className={`brand-placeholder ${size} ${variant}`}>
      <Image
        className="brand-placeholder__image"
        src="/NoPrazo/logo.jpeg"
        alt={label}
        width={1600}
        height={900}
        priority
      />
    </div>
  );
}

export function BrandWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`brand-mark ${compact ? "brand-mark--compact" : "brand-mark--default"}`}
      aria-label="NoPrazo logo"
    >
      <span className="brand-mark__badge" aria-hidden="true">
        <span className="brand-mark__check" />
      </span>
      <span className="brand-mark__text">NoPrazo</span>
    </div>
  );
}