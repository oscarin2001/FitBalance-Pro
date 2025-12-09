import { redirect } from "next/navigation";

export const metadata = {
  title: "Agregar Nutricionista",
};

export default async function Page({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  redirect(`/${orgSlug}/professionals?type=nutritionist`);
}
