import type { ReactNode } from "react";
import { OrgShell } from "../_components/org-shell";

export default function OrganizationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <OrgShell>{children}</OrgShell>;
}
