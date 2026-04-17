import { Hero } from "@/components/home/Hero";
import { HomepageChat } from "@/components/chat/HomepageChat";
import { LabNotesFeature } from "@/components/home/LabNotesFeature";
import { PairedCards } from "@/components/home/PairedCards";
import { About } from "@/components/home/About";

export function Home() {
  return (
    <main id="main" className="mx-auto w-full max-w-content px-6 md:px-10">
      <Hero />
      <HomepageChat />
      <LabNotesFeature />
      <PairedCards />
      <About />
    </main>
  );
}
