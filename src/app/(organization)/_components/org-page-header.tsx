import * as React from "react";

type OrgPageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export function OrgPageHeader({
  title,
  description,
  actions,
}: OrgPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border/80 pb-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Organizacion
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-col gap-2 sm:flex-row">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
