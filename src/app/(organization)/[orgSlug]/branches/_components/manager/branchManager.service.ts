export async function listProfessionals(orgSlug: string) {
  const res = await fetch(
    `/api/organization/management/v1/professionals/list?orgSlug=${encodeURIComponent(
      orgSlug
    )}`,
    { credentials: "include" }
  );
  if (!res.ok) throw new Error("failed to load professionals");
  const json = await res.json();
  return json?.professionals || json || [];
}

export async function assignManager(
  orgSlug: string,
  branchId: number,
  professionalId: number | null
) {
  const body: any = { professionalId };
  const res = await fetch(
    `/api/organization/operations/branches/${branchId}/manager?orgSlug=${encodeURIComponent(
      orgSlug
    )}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error("failed to assign manager");
  return res.json();
}
