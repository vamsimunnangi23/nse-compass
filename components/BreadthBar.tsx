export function BreadthBar({
  advancers,
  decliners,
  unchanged,
}: {
  advancers: number;
  decliners: number;
  unchanged: number;
}) {
  const total = Math.max(advancers + decliners + unchanged, 1);
  const pct = (n: number) => (n / total) * 100;

  return (
    <div>
      <div
        className="flex h-4 w-full overflow-hidden rounded-full bg-border"
        role="img"
        aria-label={`Market breadth: ${advancers} advancing, ${unchanged} unchanged, ${decliners} declining, out of ${total} tracked stocks`}
      >
        <div
          className="h-full bg-accent"
          style={{ width: `${pct(advancers)}%`, marginRight: unchanged || decliners ? 2 : 0 }}
        />
        <div
          className="h-full bg-muted/40"
          style={{ width: `${pct(unchanged)}%`, marginRight: decliners ? 2 : 0 }}
        />
        <div className="h-full bg-danger" style={{ width: `${pct(decliners)}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <Legend swatchClass="bg-accent" label="Advancing" value={advancers} />
        <Legend swatchClass="bg-muted/40" label="Unchanged" value={unchanged} />
        <Legend swatchClass="bg-danger" label="Declining" value={decliners} />
      </div>
    </div>
  );
}

function Legend({
  swatchClass,
  label,
  value,
}: {
  swatchClass: string;
  label: string;
  value: number;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${swatchClass}`} />
      <span className="text-muted">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </span>
  );
}
