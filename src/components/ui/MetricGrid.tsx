import { MetricCounter } from "@/components/ui/MetricCounter";
import { metrics } from "@/data/content";

/** The headline impact metrics. Shared by the Impact chapter and the Classic View. */
export function MetricGrid() {
  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {metrics.map((metric) => (
        <li key={metric.id}>
          <MetricCounter label={metric.label} before={metric.before} after={metric.after} note={metric.note} />
        </li>
      ))}
    </ul>
  );
}
