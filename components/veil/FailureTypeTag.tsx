"use client";

import { Badge } from "@/components/ui/badge";
import { FAILURE_CATEGORIES, type FailureCategory } from "@/lib/rules/categories";

const severityColors: Record<string, string> = {
  critical: "bg-red-500/10 text-red-500 border-red-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

interface FailureTypeTagProps {
  category: string;
  severity?: string;
}

export function FailureTypeTag({ category, severity }: FailureTypeTagProps) {
  const label = FAILURE_CATEGORIES[category as FailureCategory] ?? category;
  const colorClass = severityColors[severity ?? "medium"] ?? severityColors.medium;

  return (
    <Badge variant="outline" className={colorClass}>
      {label}
    </Badge>
  );
}
