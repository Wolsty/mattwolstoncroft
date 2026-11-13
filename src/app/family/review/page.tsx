import type { Metadata } from "next";
import data from "@/content/family.json";
import type { FamilyData } from "@/lib/family/types";
import { FamilyReview } from "@/components/family/FamilyReview";

export const metadata: Metadata = {
  title: "Review · Family",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function FamilyReviewPage() {
  return <FamilyReview data={data as unknown as FamilyData} />;
}
