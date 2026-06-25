import type { Metadata } from "next";
import { WeeklyReadout } from "./WeeklyReadout";

export const metadata: Metadata = {
  title: "Weekly Experiment Readout — Sample",
  description:
    "Sample weekly experiment readout from the Rx-purchase funnel CRO program at SeekWell. Structure mirrors readouts I ran; metrics are illustrative and sanitized.",
  robots: { index: false, follow: false },
};

export default function WeeklyReadoutPage() {
  return <WeeklyReadout />;
}
