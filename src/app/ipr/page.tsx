import type { Metadata } from "next";
import { CaseStudyShell } from "@/components/case-study/CaseStudyShell";
import { Figure } from "@/components/case-study/Figure";
import { DecisionBlock } from "@/components/case-study/DecisionBlock";
import { PrevNext } from "@/components/case-study/PrevNext";

export const metadata: Metadata = {
  title: "iPR Software",
  description:
    "Client-branded newsrooms for Target, Toyota, Xerox, NVIDIA, Forever 21, Dunkin — and lead product design on the CMS platform those brands ran on. My first time designing for real users.",
};

export default function IprPage() {
  return (
    <CaseStudyShell
      meta={{
        title: "iPR Software",
        status: "Shipped",
        metadata: [
          "2014–2017",
          "UX Designer / Lead",
          "PR & Marketing SaaS",
          "Enterprise brand newsrooms",
          "Shipped",
        ],
      }}
      hero={
        <Figure
          src="/images/case-studies/ipr/online-newsrooms.png"
          alt="A composition of iPad devices showing four iPR-powered brand newsrooms — Toyota, Forever 21, American Heart Association, and a nonprofit client — each styled to the brand, each running on the same CMS platform."
          caption="iPR-powered brand newsrooms for enterprise clients: one platform underneath, the brand on top."
          wide
          priority
          width={1920}
          height={1402}
        />
      }
    >
      <h2 className="font-display mt-0">Context</h2>
      <p>
        iPR Software is a PR and marketing SaaS: a web-based CMS for
        publishing, hosting, and distributing news and multimedia. Online
        News Centers, Digital Asset Management, Social Media Hubs, Content
        Marketing. The platform is cloud-hosted, requires no IT support, and
        is the infrastructure under a long list of enterprise newsrooms:{" "}
        <em>
          Target, Toyota, Xerox, NVIDIA, Forever 21, Dunkin Brands, American
          Heart Association
        </em>
        .
      </p>
      <p>
        My role was two jobs in one seat. I was the integrator who stood up
        those client newsrooms end-to-end, matching each brand&apos;s
        standards on top of the iPR stack, <em>and</em> I was the lead
        product designer for the platform itself. It was my first time
        designing for real users &mdash; not classroom projects,{" "}
        <em>actual</em> marketing managers and corporate comms teams
        depending on the thing to do their job every day.
      </p>

      <h2 className="font-display mt-[var(--block-gap)]">Tension</h2>
      <p>The two jobs pulled in opposite directions:</p>
      <blockquote
        className="pl-6 italic"
        style={{
          borderLeft: "2px solid var(--accent)",
          color: "var(--fg)",
          fontSize: "var(--type-tension)",
          lineHeight: 1.35,
          margin: "2rem 0",
        }}
      >
        Every brand newsroom I shipped had to look and feel like the brand,
        not like iPR. Every product decision I made in the CMS had to
        survive <em>every</em> brand newsroom it was about to power.
      </blockquote>
      <p>
        When you&apos;re integrating into Toyota or Forever 21, the product
        surface has to disappear under the client&apos;s visual identity,
        typography, and editorial voice. A reader landing on the Forever 21
        newsroom should not know &mdash; or care &mdash; that a platform
        called iPR Software is underneath it.
      </p>
      <p>
        Which means the platform I was also designing had to be{" "}
        <strong>themeable all the way down</strong>, stable enough for
        enterprise PR teams to bet their launches on, and simple enough that
        a marketing manager with no IT support could publish a press release
        at 4:55 p.m. on a Friday. Each brand integration was a live
        stress-test of every product decision.
      </p>

      <h2 className="font-display mt-[var(--block-gap)]">Approach</h2>

      <h3 className="font-display">1. Learn to design for real users by standing next to them.</h3>
      <p>
        The most important thing iPR gave me was access. Every client
        integration was an excuse to sit with a real PR or comms team and
        watch them try to do their jobs in software. I stopped designing
        from taste and started designing from observation. The pattern I saw
        over and over: these teams didn&apos;t need more features; they
        needed the features they had to be findable, forgiving, and fast to
        repeat. That single reframing shaped the rest of my career.
      </p>

      <h3 className="font-display">2. Treat the client newsroom as the canonical product surface.</h3>
      <p>
        I built each brand newsroom as a first-class artifact &mdash; not a
        templated skin, but a full editorial site designed against the
        brand&apos;s standards, with the CMS underneath. That choice forced
        the platform to get better: every time I hit a wall on a Toyota or
        Forever 21 integration, the wall became a product ticket. The
        newsrooms I was shipping for big clients were the quality bar for
        the self-service tier.
      </p>
      <Figure
        src="/images/case-studies/ipr/forever-21-newsroom.png"
        alt="Forever 21 Newsroom on iPad: a social-media-first grid layout with brand tiles, headline chips, and imagery from the campaign. Navigation reads New Store Openings, Social Media, Media Library, About Forever 21."
        caption="Forever 21 Newsroom. A social-media-native layout, tuned to the brand, running on the iPR stack."
        width={1100}
        height={1346}
      />

      <h3 className="font-display">3. Build the product so a marketing manager can publish without a ticket.</h3>
      <p>
        Corporate comms teams are small, fast, and constantly interrupted.
        The platform had to support a single marketing manager pushing a
        press release live on a deadline, without needing a developer, a
        designer, or a support rep in the loop. That constraint did more to
        simplify the IA than any design principle I could have written
        down &mdash; it killed entire features outright.
      </p>

      <h2 className="font-display mt-[var(--block-gap)]">Decisions</h2>

      <DecisionBlock heading="Decision 1: The brand owns the front end; the platform owns the plumbing">
        <p>
          The easy path is to ship every client a templated newsroom that
          quietly reads as <em>iPR Software</em> with a logo swap. I fought
          for the opposite: let each enterprise brand have a newsroom that
          looked like <em>them</em>, down to the typography, grid, and
          editorial tone. iPR disappears underneath.
        </p>
        <p>
          The cost was real &mdash; each integration took more design and
          QA time than a templated deploy. The payoff was that the brands
          renewed, referred, and used iPR as their canonical press surface
          rather than a press-release side door. That decision is the reason
          Target, Toyota, Xerox, and NVIDIA stayed on the platform.
        </p>
      </DecisionBlock>

      <DecisionBlock heading="Decision 2: Define the need before you draw the screen">
        <p>
          Before iPR, my design work started with the screen. At iPR, I
          learned &mdash; often the hard way &mdash; that the screen is the
          last thing you make. A comms team asking for a &ldquo;better asset
          library&rdquo; really wanted to hand off the next launch to their
          agency without emailing a zip file. A marketing manager asking for
          &ldquo;more social features&rdquo; really wanted a single place to
          schedule a coordinated press-plus-social push.
        </p>
        <p>
          I got into the habit of writing the user&apos;s actual job, in
          their words, at the top of every spec &mdash; before sketching
          anything. It slowed me down at first and saved huge amounts of
          rebuild later. It&apos;s the single habit from iPR I still lead
          with in every project.
        </p>
      </DecisionBlock>

      <DecisionBlock heading="Decision 3: The self-service tier is the enterprise tier, minus the hands">
        <p>
          iPR sold to Fortune 500 comms shops <em>and</em> to small
          businesses, freelancers, and nonprofits. The temptation was to
          fork &mdash; one UI for the big clients, a simpler one for
          everyone else. I argued the opposite: if the product was already
          usable by Forever 21&apos;s comms team without constant hand-holding,
          it was already usable by a nonprofit&apos;s one-person
          communications department. Forking would have doubled our
          maintenance cost and halved our leverage.
        </p>
        <p>
          So the enterprise newsrooms and the self-service tier ran on the
          same product. What differed was onboarding, support, and the
          level of brand customization up front. The underlying tool was
          one tool. That was the first time I saw, firsthand, how
          information architecture decisions compound across a company.
        </p>
      </DecisionBlock>

      <h2 className="font-display mt-[var(--block-gap)]">Shipped</h2>
      <p>What went live over three years:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Enterprise brand newsrooms:</strong> integrated and
          shipped iPR-powered online newsrooms for Target, Toyota, Xerox,
          NVIDIA, Forever 21, Dunkin Brands, and the American Heart
          Association, among others. Each built to the client&apos;s brand
          standards on top of the same platform.
        </li>
        <li>
          <strong>Digital Asset Management:</strong> images, video, and
          document library scoped to the brand, with publishing permissions
          for comms teams and read-only access for press.
        </li>
        <li>
          <strong>Social Media Hubs:</strong> cross-channel social layouts
          (Forever 21&apos;s social grid is the canonical example) that
          stitched the newsroom to the brand&apos;s live social channels.
        </li>
        <li>
          <strong>Content marketing &amp; distribution:</strong> publishing
          to corporate sites, social channels, newswires, search, and
          traditional media outlets, from a single editorial workflow.
        </li>
        <li>
          <strong>Self-service tier:</strong> the same platform, tuned for
          mid-size businesses, freelancers, and nonprofits to publish
          without IT support.
        </li>
      </ul>

      <h2 className="font-display mt-[var(--block-gap)]">Reflection</h2>
      <p>
        iPR is the project where I became a product designer. Before it, I
        was a designer who happened to be drawing interfaces. After it, I
        was someone who understood that the artifact on the screen is the
        smallest part of the job &mdash; the research, the constraints, the
        workflow that lives around the screen, and the business the
        software has to survive inside are the product.
      </p>
      <p>
        The thing I would tell my younger self about this job: you&apos;re
        not being paid to have opinions; you&apos;re being paid to turn
        other people&apos;s work into something they can do faster,
        cleaner, and with less help. That frame is the reason every project
        since &mdash; Progrexion, SeekWell, LabNotes, Cengage, JAMS &mdash;
        starts from the same place: sit with the user, write down what they
        are actually trying to do, and only then open the design file.
      </p>

      <PrevNext
        prev={{ href: "/jams", label: "JAMS Access" }}
        next={{ href: "/", label: "Home" }}
      />
    </CaseStudyShell>
  );
}
