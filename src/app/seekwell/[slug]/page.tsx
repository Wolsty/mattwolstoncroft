import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyShell } from "@/components/case-study/CaseStudyShell";
import { ExpandableFigure } from "@/components/case-study/ExpandableFigure";
import { Figure } from "@/components/case-study/Figure";
import { PrevNext } from "@/components/case-study/PrevNext";
import { SectionRenderer } from "@/components/case-study/SectionRenderer";
import {
  SEEKWELL_CASES,
  getSeekwellCase,
  getSeekwellNeighbors,
} from "@/content/seekwell";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return SEEKWELL_CASES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug } = await params;
  const cs = getSeekwellCase(slug);
  if (!cs) return { title: "SeekWell" };
  return {
    title: cs.title,
    description: cs.blurb,
  };
}

export default async function SeekwellSubPage(
  { params }: { params: Promise<Params> },
) {
  const { slug } = await params;
  const cs = getSeekwellCase(slug);
  if (!cs) return notFound();

  const { prev, next } = getSeekwellNeighbors(slug);

  return (
    <CaseStudyShell
      meta={{
        title: cs.title,
        metadata: cs.metadata,
      }}
      hero={
        cs.featuredImage ? (
          <ExpandableFigure
            src={cs.featuredImage.src}
            alt={cs.featuredImage.alt}
            caption={cs.featuredImage.caption}
            width={cs.featuredImage.width ?? 2800}
            height={cs.featuredImage.height ?? 1600}
            wide
            priority
          />
        ) : (
          <div
            className="rounded p-8 md:p-12"
            style={{ border: "1px solid var(--rule)" }}
          >
            <p className="meta mb-4">{cs.thumbnailLabel}</p>
            <p
              className="italic max-w-prose font-body"
              style={{ fontSize: "var(--type-tension)", color: "var(--fg-muted)", lineHeight: 1.4 }}
            >
              {cs.blurb}
            </p>
          </div>
        )
      }
      backHref="/seekwell"
      backLabel="SeekWell"
    >
      <SectionRenderer sections={cs.sections} />

      {cs.images && cs.images.length > 0 ? (
        <section
          aria-label="Selected screens"
          className="rule-top mt-[var(--block-gap)] pt-[var(--block-gap)]"
        >
          <h2 className="meta mb-4">Selected screens</h2>
          {cs.images.map((img) => (
            <Figure
              key={img.src}
              src={img.src}
              alt={img.alt}
              wide
              width={2400}
              height={1500}
            />
          ))}
        </section>
      ) : null}

      <PrevNext
        prev={
          prev
            ? { href: `/seekwell/${prev.slug}`, label: prev.title }
            : { href: "/seekwell", label: "SeekWell index" }
        }
        next={
          next
            ? { href: `/seekwell/${next.slug}`, label: next.title }
            : { href: "/progrexion", label: "Progrexion" }
        }
      />
    </CaseStudyShell>
  );
}
