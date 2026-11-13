import type { Metadata } from "next";
import { Suspense } from "react";
import { FamilyLogin } from "@/components/family/FamilyLogin";

export const metadata: Metadata = {
  title: "Family",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function FamilyLoginPage() {
  return (
    <Suspense>
      <FamilyLogin />
    </Suspense>
  );
}
