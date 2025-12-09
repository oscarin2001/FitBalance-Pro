"use client";
import QuickActionsV2 from "./QuickActions.v2";
import { ProfessionalTypeFilter } from "./lib/types";

type LegacyProps = {
  orgSlug: string;
  showCoachForm?: boolean;
  showNutritionistForm?: boolean;
  coachHref?: string;
  nutritionistHref?: string;
  typeFilter?: ProfessionalTypeFilter;
  onCreateSuccess?: (k: ProfessionalTypeFilter) => void;
  onOpenCreate?: (type?: ProfessionalTypeFilter) => void;
};

export default function QuickActions(props: LegacyProps) {
  const {
    orgSlug,
    showCoachForm,
    showNutritionistForm,
    typeFilter: incomingTypeFilter,
    onOpenCreate,
  } = props;

  // Prefer an explicitly provided `typeFilter` prop (new usage).
  // Fall back to legacy boolean flags for backwards compatibility.
  const typeFilter = incomingTypeFilter
    ? incomingTypeFilter
    : showCoachForm
    ? ("coach" as ProfessionalTypeFilter)
    : showNutritionistForm
    ? ("nutritionist" as ProfessionalTypeFilter)
    : undefined;

  return (
    <QuickActionsV2
      orgSlug={orgSlug}
      typeFilter={typeFilter}
      onOpenCreate={onOpenCreate}
    />
  );
}
