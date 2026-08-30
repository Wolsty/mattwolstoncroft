import { Hero } from "@/components/home/Hero";
import { About } from "@/components/home/About";
import { FeaturedNote } from "@/components/home/FeaturedNote";
import { ProjectCards } from "@/components/home/ProjectCards";

export function Home() {
  return (
    <main id="main" className="mx-auto w-full max-w-content px-6 md:px-10">
      <Hero />
      <About />
      <FeaturedNote />
      <ProjectCards />
    </main>
  );
}
