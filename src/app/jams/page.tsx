import type { Metadata } from "next";
import { CaseStudyShell } from "@/components/case-study/CaseStudyShell";
import { Figure } from "@/components/case-study/Figure";
import { DecisionBlock } from "@/components/case-study/DecisionBlock";
import { PrevNext } from "@/components/case-study/PrevNext";

export const metadata: Metadata = {
  title: "JAMS Access",
  description:
    "A complete redesign of JAMS Access, the secure case-management platform for alternative dispute resolution. Five user types, one product surface, case-type-aware permissions.",
};

export default function JamsPage() {
  return (
    <CaseStudyShell
      meta={{
        title: "JAMS Access",
        status: "Shipped",
        metadata: [
          "2025–2026",
          "Lead Product Designer",
          "LegalTech / ADR",
          "Five user types",
          "Shipped",
        ],
      }}
      hero={
        <Figure
          src="/images/case-studies/jams/case-list.png"
          alt="JAMS Access Case List: 100 total cases across Arbitrations, Mediations, and Court References, with Case Name & Ref #, Type, Neutral, and Case Manager columns."
          caption="JAMS Access, Case List. The canonical workspace: 100+ active cases per Case Manager, filtered by type and status."
          wide
          priority
          width={1440}
          height={1191}
        />
      }
    >
      <h2 className="font-display mt-0">Context</h2>
      <p>
        JAMS is the largest private alternative dispute resolution (ADR)
        provider in the world. Its neutrals — arbitrators and mediators —
        handle cases that have left or stepped aside from the court system:
        complex commercial disputes, class actions, employment claims,
        high-profile mediations. JAMS Access is the secure, online case
        management platform those cases live in, where attorneys file a
        dispute, parties upload discovery, neutrals read the record and run
        the proceeding, and case managers orchestrate everything in the
        middle.
      </p>
      <p>
        I was brought in to completely redesign it. Not a visual refresh, a
        full re-architecture of how the product works, starting from the
        roles it serves. The redesign is live today at{" "}
        <em>access.jamsadr.com</em>.
      </p>

      <h2 className="font-display mt-[var(--block-gap)]">Tension</h2>
      <p>
        A platform everyone on a case touches, but no two people use the same
        way:
      </p>
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
        Five user types, one product surface. Each role sees a different
        case, a different set of permissions, and a different meaning of
        the word &ldquo;document&rdquo; &mdash; but they all have to be in
        the same conversation, on the same day, under the same rules.
      </blockquote>
      <p>
        Attorneys submit cases. Clients (and sub-clients who work under them)
        upload filings, track the calendar, and pay fees. Neutrals read the
        record, rule on motions, and manage their own availability. Case
        Managers orchestrate the whole thing: they set the permissions, route
        the documents, schedule sessions, and reconcile the finances. An
        admin sits above them all.
      </p>
      <p>
        Designing for any one of those roles would have been a clean UX
        problem. Designing for all five, on the same screens, with the right
        information carefully withheld from each one, is the real problem,
        and it&apos;s the problem every existing legal-tech platform I looked
        at had either punted on or broken into five disconnected tools.
      </p>

      <h2 className="font-display mt-[var(--block-gap)]">Approach</h2>
      <p>I started with roles, not screens.</p>

      <h3 className="font-display">1. Five personas. Five sheets of paper.</h3>
      <p>
        For each user type &mdash; Client, Sub-Client, Neutral, Case Manager,
        Admin &mdash; I put a persona board on the wall:{" "}
        <em>User Goals, User Tasks (TBD), Permissions, Pain Points</em>. I
        wrote the top of the board before I drew a single screen. The goal
        wasn&apos;t to make archetypes pretty; it was to force us to say, out
        loud, what each role is and is not allowed to do, what they&apos;re
        allowed to see, and what they&apos;re always going to complain about
        if we don&apos;t fix it.
      </p>

      <Figure
        src="/images/case-studies/jams/persona-case-manager.png"
        alt="JAMS persona board for the Case Manager role: hand-drawn avatar with User Goals, User Tasks (TBD), Permissions, and Pain Points captured in sticky notes."
        caption="Case Manager persona board. Four quadrants — Goals, Tasks, Permissions, Pain Points — written before any screen."
        width={926}
        height={1235}
      />
      <Figure
        src="/images/case-studies/jams/persona-neutral.png"
        alt="JAMS persona board for the Neutral role: sticky notes covering arbitrator/mediator goals, task list, permissions, and pain points."
        caption="Neutral persona board. Arbitrators and mediators share a role in the product, but the tasks and permissions cleave."
        width={926}
        height={1235}
      />
      <Figure
        src="/images/case-studies/jams/persona-client.png"
        alt="JAMS persona board for the Client role: sticky notes showing client-side goals, the actions they take on a case, the boundaries of what they can see, and their top frustrations."
        caption="Client persona board. The party on the case: the one who has least context on the platform and most at stake on the outcome."
        width={926}
        height={1235}
      />

      <h3 className="font-display">2. Site map as a shared skeleton.</h3>
      <p>
        Once the roles were concrete, I mapped the full portal as one shared
        information architecture &mdash; Portal Home, Submit a Case, View
        Cases, Case #, Calendar, Messages, Documents, Invoices, Timesheets
        &mdash; so every role would navigate the same building, even if they
        were unlocked into different rooms. That single-skeleton decision is
        what keeps the platform from fragmenting into five disconnected
        products as more features ship.
      </p>
      <Figure
        src="/images/case-studies/jams/portal-site-map.png"
        alt="JAMS Access portal site map on a whiteboard, built from sticky notes: Portal Home at the top with branching nodes for View Cases, Submit a Case, Case #, Calendar, Messages, Documents, and Invoices."
        caption="Portal site map. One skeleton, five role resolutions."
        width={926}
        height={1236}
      />

      <h3 className="font-display">3. Task flows that encoded the permissions, not just the actions.</h3>
      <p>
        The most complex single touchpoint in the platform is the document
        layer. So I mapped it twice &mdash; once for a Neutral, once for a
        Client &mdash; and wrote the permission rule at the top of each
        flow.{" "}
        <strong>
          Mediation: each side only sees what they upload. Arbitration:
          everyone can see the docs, if granted by the Case Manager.
        </strong>{" "}
        That rule, more than any other sentence in the project, shaped what
        the product is.
      </p>
      <Figure
        src="/images/case-studies/jams/file-management-neutral.jpg"
        alt="Whiteboard task flow for File Management as a Neutral: Portal Home → View Cases → Case # → Case Messages → Submit Timesheet, with sticky notes for filter/sort, bulk file download, search by filename, and a permission rule noting Mediation vs Arbitration visibility."
        caption="File Management, Neutral flow. The permission rule, written in yellow on the top right, set the rest of the design."
        width={926}
        height={1234}
      />
      <Figure
        src="/images/case-studies/jams/file-management-client.jpg"
        alt="Whiteboard task flow for File Management as a Client: Portal Home → View Cases → Case # → Case Messages, with sticky notes for hide/show file, create/group folders, rename, search, print, view, bulk download, multi-file upload, and per-file permission setting managed by the Case Manager."
        caption="File Management, Client flow. Same skeleton, different actions, different permissions set by the Case Manager."
        width={953}
        height={1270}
      />

      <h2 className="font-display mt-[var(--block-gap)]">Decisions</h2>

      <DecisionBlock heading="Decision 1: Mediation and arbitration have fundamentally different privacy models — and the UI has to encode that, not rely on training">
        <p>
          In mediation, the two sides are negotiating. Party A uploads
          something; only their team and the mediator see it. In arbitration,
          the neutral is ruling on the record; everyone sees everything
          unless the Case Manager says otherwise. That difference isn&apos;t
          a permission toggle on a file. It&apos;s the contract each case
          type carries with it.
        </p>
        <p>
          I designed the Documents surface to read the case type first and
          derive permissions from there, not the other way around. A Client
          in a mediation literally cannot see the other side&apos;s uploads
          in the UI. A Client in an arbitration sees a unified record. The
          Case Manager has a separate document management view that makes
          those boundaries visible at a glance, with the ability to grant
          exceptions case-by-case when the agreement allows.
        </p>
        <p>
          The alternative &mdash; a generic shared drive with role-based
          permissions stamped on top &mdash; would have shipped faster and
          leaked. In ADR, a single misrouted document can end a career. The
          permission model needed to be legible to a busy Case Manager on a
          Tuesday afternoon, not a theoretical correctness argument.
        </p>
        <Figure
          src="/images/case-studies/jams/documents-case-manager.png"
          alt="JAMS Access case workspace for BrightStar Enterprises vs. Horizon Consulting Group, Documents tab, Case Manager view. A table of 12 documents with Classification, Members, Uploaded By, and Uploaded On columns, plus Delete, Download, and Upload New actions at the top."
          caption="Case workspace, Documents tab, Case Manager view. The Members column makes cross-party visibility explicit for every file."
          width={1440}
          height={1284}
          wide
        />
      </DecisionBlock>

      <DecisionBlock heading="Decision 2: Submit a Case is a nine-step wizard, not a form">
        <p>
          Submitting a new dispute is the single heaviest write operation in
          JAMS Access. An attorney is committing to: who the parties are,
          what the dispute is about, which clauses in the agreement govern,
          which rules will apply, and how JAMS gets paid. A single-page form
          would have been faster to build. It would also have been the
          place every user abandoned.
        </p>
        <p>
          I broke the flow into nine explicit steps, grouped into three acts
          &mdash; <em>Getting Started, Case Information, Finalize &amp;
          Submit</em> &mdash; and made progress visible at every moment.
          &ldquo;Step 1 of 9. 11% complete.&rdquo; Each step saves on
          continue. <em>Save &amp; Exit</em> is a first-class action in the
          footer, not an afterthought buried in a menu. The friction
          isn&apos;t the question count; the friction is what happens when a
          busy attorney puts the form down for ten days and comes back to
          find a blank slate.
        </p>
        <p>
          The first step is also the right kind of small. A single question
          &mdash; <em>Who is submitting this case?</em> &mdash; with clear
          guidance that the submitter may be different from the claimant, and
          a single optional field for the firm. That opening screen sets the
          tone: this is a serious operation, but each step is answerable.
        </p>
        <Figure
          src="/images/case-studies/jams/submit-case-wizard.png"
          alt="JAMS Access Submit a Case wizard, Step 1 of 9: “Who is submitting this case?” with First Name, Last Name, Law Firm (Optional), Email, Phone, and Title fields. A left sidebar shows the three-act structure: Getting Started, Case Information, Finalize & Submit, with nine total steps."
          caption="Submit a Case, Step 1 of 9. Three acts, nine steps, persistent save, a single primary question per screen."
          width={1561}
          height={1015}
          wide
        />
      </DecisionBlock>

      <DecisionBlock heading="Decision 3: One sidebar, role-aware">
        <p>
          The hardest call in the whole project: do the five roles get five
          different navigations? The fastest path to shipping would have been
          yes. I said no, and designed a single sidebar &mdash;{" "}
          <em>
            Overview, Case List, Calendar, Activity, Inbox, AAE Submissions,
            JAMS Institute
          </em>{" "}
          &mdash; where each entry resolves differently depending on who you
          are, and entries the role doesn&apos;t have access to simply
          aren&apos;t there.
        </p>
        <p>
          The payoff is largest in the moments the product disappears: a Case
          Manager onboarding a new Client on the phone can describe exactly
          what the Client is about to see, because the Case Manager is
          looking at the same navigation. Support calls collapsed in testing.
          New-neutral training time dropped. And cross-role features &mdash;
          the ones where a Client uploads a document and a Neutral
          acknowledges it an hour later &mdash; are designed as one flow,
          not two stitched together at the database.
        </p>
      </DecisionBlock>

      <h2 className="font-display mt-[var(--block-gap)]">Shipped</h2>
      <p>
        JAMS Access is live at <em>access.jamsadr.com</em>. What&apos;s in
        production today:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Submit a Case:</strong> nine-step wizard, persistent save,
          role-aware submitter flow. The single heaviest intake in the
          product, designed to be resumable.
        </li>
        <li>
          <strong>Case List:</strong> the canonical daily workspace. Filters
          for <em>All Cases / Arbitrations / Mediations / Court References /
          Bookmarks</em>, sort and search, with per-row Case Name &amp; Ref #,
          Type, Neutral, and Case Manager. Designed around the reality that a
          single Case Manager may be shepherding 100+ active cases at once.
        </li>
        <li>
          <strong>Case workspace:</strong> a single tabbed surface every role
          opens into &mdash;{" "}
          <em>
            Documents, Case Information, Messages, Case Dates, Invoices,
            Timesheets
          </em>{" "}
          &mdash; resolved differently per role and per case type.
        </li>
        <li>
          <strong>Centralized document management:</strong> case-type-aware
          permissions, bulk upload and download, classification, and an
          explicit Members column that shows exactly who can see a given
          file. No more email attachments, no more FedEx.
        </li>
        <li>
          <strong>Secure messaging:</strong> tied to the case record, scoped
          to the participants entitled to see it. Notification preferences
          per role, per case, per message type.
        </li>
        <li>
          <strong>Financial management:</strong> invoices, fee schedules, and
          account statements surfaced inside the case to the parties who
          should see them, with direct payment in-platform.
        </li>
        <li>
          <strong>Security posture:</strong> encrypted in transit and at
          rest, cloud-hosted, and designed against JAMS&apos; existing
          security and confidentiality controls rather than fighting them.
        </li>
      </ul>

      <h2 className="font-display mt-[var(--block-gap)]">Reflection</h2>
      <p>
        The lesson JAMS Access taught me, more than any other project
        I&apos;ve led: in a B2B product with multiple user types, the
        information architecture <em>is</em> the product. Everything else
        &mdash; visual design, interaction detail, even the AI layer on top
        &mdash; is downstream of whether you got the roles and permissions
        right. If you didn&apos;t, no amount of polish rescues it. If you
        did, the thing tends to feel inevitable.
      </p>
      <p>
        The two things I would have pushed harder on with another quarter: a
        cross-role notification model that genuinely feels like a
        conversation rather than a log, and a Case Manager home that reads
        more like a queue than a list. Both are on the roadmap the team
        picked up from the redesign, and both are the obvious next move for
        an AI layer to make itself useful without ever announcing itself.
      </p>

      <PrevNext
        prev={{ href: "/progrexion", label: "Progrexion" }}
        next={{ href: "/ipr", label: "iPR Software" }}
      />
    </CaseStudyShell>
  );
}
