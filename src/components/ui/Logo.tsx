import Image from "next/image";

/** Simbi Logistics brand mark — navy square with a white cursive "S". */
export function Logo({ size = 32, className = "rounded-lg" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Simbi Logistics"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
