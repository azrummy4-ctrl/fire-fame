import { Coins, MapPin } from "lucide-react";

export function SpinWheel({ amounts, spinning }: { amounts: number[]; spinning: boolean }) {
  const sectors = Array.from({ length: 8 }, (_, index) => amounts[index % amounts.length] ?? 1);
  return (
    <div className="spin-wheel-frame relative mx-auto aspect-square w-full max-w-72">
      <MapPin className="spin-pointer absolute -top-2 left-1/2 z-10 size-10 -translate-x-1/2" fill="currentColor" aria-hidden="true" />
      <svg viewBox="0 0 320 320" className={`size-full ${spinning ? "milestone-wheel-spinning" : ""}`} role="img" aria-label={`Lucky wheel rewards: ${[...new Set(sectors)].join(', ')} rupees`}>
        <circle cx="160" cy="160" r="155" className="spin-rim" />
        {sectors.map((amount, index) => {
          const start = (index * 45 - 112.5) * Math.PI / 180;
          const end = start + Math.PI / 4;
          const middle = start + Math.PI / 8;
          const x1 = 160 + 143 * Math.cos(start), y1 = 160 + 143 * Math.sin(start);
          const x2 = 160 + 143 * Math.cos(end), y2 = 160 + 143 * Math.sin(end);
          const tx = 160 + 110 * Math.cos(middle), ty = 160 + 110 * Math.sin(middle);
          return <g key={index}>
            <path d={`M160 160 L${x1} ${y1} A143 143 0 0 1 ${x2} ${y2} Z`} className={index % 2 === 0 ? "spin-sector-dark" : "spin-sector-green"} />
            <text x={tx} y={ty} textAnchor="middle" dominantBaseline="central" transform={`rotate(${index * 45}, ${tx}, ${ty})`} className={index % 2 === 0 ? "spin-label-green" : "spin-label-dark"}>₹{amount}</text>
          </g>;
        })}
        <circle cx="160" cy="160" r="55" className="spin-hub" />
      </svg>
      <Coins className="spin-hub-icon pointer-events-none absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2" />
    </div>
  );
}