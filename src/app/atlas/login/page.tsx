import type { Metadata } from "next";
import { Suspense } from "react";
import { AtlasLogin } from "@/components/atlas/AtlasLogin";

export const metadata: Metadata = {
  title: "Atlas",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AtlasLoginPage() {
  return (
    <Suspense>
      <AtlasLogin />
    </Suspense>
  );
}
