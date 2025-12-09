import { redirect } from "next/navigation";

export const metadata = {
  title: "Agregar Coach",
};

export default async function Page({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  redirect(`/${orgSlug}/professionals?type=coach`);
}
