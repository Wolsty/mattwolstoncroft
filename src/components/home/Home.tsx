import { Hero } from "@/components/home/Hero";
import { About } from "@/components/home/About";
import { ProjectCards } from "@/components/home/ProjectCards";
import { Earlier } from "@/components/home/Earlier";

export function Home() {
  return (
    <main id="main" className="mx-auto w-full max-w-content px-6 md:px-10">
      <Hero />
      <About />
      <ProjectCards />
      <Earlier />
    </main>
  );
}
