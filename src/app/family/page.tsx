import type { Metadata } from "next";
import data from "@/content/family.json";
import type { FamilyData } from "@/lib/family/types";
import { getPublicContributions } from "@/lib/familyStore";
import { FamilyTree } from "@/components/family/FamilyTree";

export const metadata: Metadata = {
  title: "The Wolstoncroft–Specht Family",
  description: "Four family lines from Lancashire, Hungary, Germany, Belgium and Italy that met east of Pittsburgh.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function FamilyPage() {
  const contributions = await getPublicContributions();
  return <FamilyTree data={data as unknown as FamilyData} initial={contributions} />;
}
