import { Badge } from "@/components/ui/badge";
import { previousLabels } from "@/lib/history";

export function PreviousBadges({ years }: { years?: string[] }) {
  return (
    <>
      {previousLabels(years).map((l) => (
        <Badge key={l} variant="outline" className="ml-2 border-accent bg-accent text-accent-foreground">
          {l}
        </Badge>
      ))}
    </>
  );
}
