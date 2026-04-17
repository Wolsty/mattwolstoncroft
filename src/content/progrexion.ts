/**
 * Progrexion: four condensed sub-entries, pulled from
 * /docs/case-studies-content.md sections 5-8. Rendered inline on the
 * /progrexion umbrella page (no separate sub-routes).
 */

export type ProgrexionEntry = {
  slug: string;
  title: string;
  thumbnailLabel: string;
  overview: string;
  highlights: Array<{ term?: string; body: string }>;
  outcomes?: string[];
  images?: Array<{
    src: string;
    alt: string;
    caption?: string;
    width: number;
    height: number;
    wide?: boolean;
  }>;
};

export const PROGREXION_UMBRELLA_INTRO = `At Progrexion, I led end-to-end product & UX design across several consumer-facing brands including Lexington Law, CreditRepair.com, and Credit.com. My work focused on transforming complex credit repair processes into intuitive, empowering digital experiences. As lead product designer for the Lexington Law native app (iOS and Android), I crafted a mobile-first experience that put legal-backed credit repair directly into users' hands, combining credit monitoring, dispute management, and educational tools into one seamless interface. I also led the design of CreditRepair GO, a fast and self-service mobile and web product powered by CreditRepair.com to support a growing audience of independent users looking to manage their credit without advisor intervention. Beyond mobile, I drove conversion rate optimization (CRO) efforts across Credit.com, Lexington Law, and CreditRepair.com, refining sign-up flows and redesigning client-facing interfaces to better guide users toward credit confidence and financial progress.`;

export const PROGREXION_ENTRIES: ProgrexionEntry[] = [
  {
    slug: "creditrepair-com",
    title: "CreditRepair.com App",
    thumbnailLabel: "CreditRepair.com",
    overview:
      "Redesigned the CreditRepair.com mobile app to give users more transparency, control, and confidence in their credit repair journey. Led end-to-end research, UX strategy, and UI design to create an intuitive, mobile-first experience that helps users stay informed and motivated as they work toward better credit.",
    highlights: [
      { term: "Lack of Progress Visibility", body: "Users didn't understand how disputes were progressing or what steps were being taken on their behalf." },
      { term: "Unclear Next Steps", body: "Confusion around what users should do after signing up, leading to drop-off." },
      { term: "Poor Onboarding & Login", body: "Outdated security flows, including a clunky login experience." },
      { term: "New Personalized Dashboard", body: "Service-level dashboards that clearly communicate what actions are being taken and what's next." },
      { term: "Biometric Login & Account Recovery", body: "Face ID and fingerprint login, plus streamlined account setup and recovery." },
      { term: "Score Tracker & Game Plan", body: "Visual tools that help users track their credit score and understand the factors impacting it." },
      { term: "Real-Time Progress Updates", body: "View bureau disputes, creditor interventions, and total items removed: transparency to a previously opaque process." },
    ],
    outcomes: [
      "Increased app retention among new users",
      "Higher engagement with personalized features like score tracking and dispute updates",
      "Improved app store ratings due to smoother onboarding and more actionable insights",
    ],
    images: [
      {
        src: "/images/case-studies/progrexion/creditrepair-com-onboarding.avif",
        alt: "CreditRepair.com mobile onboarding: three intro screens introducing the service, results, and tenure before the sign-up CTA.",
        caption: "CreditRepair.com: mobile onboarding and value-proposition screens.",
        width: 1315,
        height: 879,
        wide: true,
      },
    ],
  },
  {
    slug: "creditrepair-go",
    title: "CreditRepair GO",
    thumbnailLabel: "CreditRepair GO",
    overview:
      "A streamlined, affordable, digital-first alternative to traditional credit repair: no long intake, no ongoing consultations. Led concept development, core flows, prototyping, and alignment with Product and Marketing on go-to-market messaging.",
    highlights: [
      { term: "Self-Guided Dispute Engine", body: "Users could select and submit dispute requests without speaking to a representative." },
      { term: "Progress Tracker", body: "A dynamic dashboard visualized dispute status, credit score movement, and completion milestones." },
      { term: "Actionable Insights", body: "Tailored tips educated users on steps they could take alongside disputes to build stronger credit faster." },
      { term: "Simple Onboarding", body: "A 3-step account creation and credit pull process let users get started in minutes." },
    ],
    images: [
      {
        src: "/images/case-studies/progrexion/creditrepair-go-landing.avif",
        alt: "CreditRepair GO marketing landing page: self-service credit repair, $39.99 pricing, three-benefit breakdown, and free trial sign-up.",
        caption: "CreditRepair GO: self-service marketing page and pricing.",
        width: 1440,
        height: 4080,
      },
    ],
  },
  {
    slug: "lexington-law",
    title: "Lexington Law iOS & Android",
    thumbnailLabel: "Lexington Law iOS & Android",
    overview:
      "Designed the Lexington Law native app as a personal credit advocate, translating legal expertise, real-time credit monitoring, and user-friendly tools into a single mobile surface. Led end-to-end design, user interviews, usability testing, and stakeholder alignment with compliance.",
    highlights: [
      { term: "Dispute Progress Tracking", body: "Clear, modular view of each credit item being challenged, with plain-language explanations, legal context, and real-time status." },
      { term: "FICO® Score Insights", body: "Visualizations to help users track score changes and understand the impact of key events." },
      { term: "Focus Tracks", body: "Intake flow that personalized the user's dispute strategy based on their life events (identity theft, divorce, medical debt)." },
      { term: "Credit Monitoring & Alerts", body: "ReportWatch, a suite of alerts keeping users informed about credit activity and potential risks." },
      { term: "Identity Theft Protection", body: "Secure identity monitoring hub with up to $1M in insurance coverage and actionable protection tips." },
      { term: "Digital Money Manager", body: "Lightweight personal finance dashboard for income, spending, budgets, debt, and net worth." },
      { term: "Case Setup Flow Optimization", body: "Consolidated three repeat bureau-specific intakes into a single intelligent step with logic-driven mapping to Equifax, Experian, and TransUnion." },
    ],
    outcomes: [
      "Increased daily active use among paying clients by 27% within the first three months",
      "Reduced support ticket volume by 21% through clearer dispute and score tracking interfaces",
      "Increased enrollment in identity protection and monitoring services by 18%",
      "Strong qualitative feedback from users who felt \"more in control\" and \"less overwhelmed\"",
    ],
    images: [
      {
        src: "/images/case-studies/progrexion/lexington-law-screens.avif",
        alt: "Lexington Law iOS: FICO Score overview, TransUnion dispute case details, case overview with 86% removal, and score factor breakdown.",
        caption: "Lexington Law: FICO Score, dispute case, case overview, and score factors.",
        width: 1702,
        height: 845,
        wide: true,
      },
      {
        src: "/images/case-studies/progrexion/lexington-law-credit-reports.avif",
        alt: "Lexington Law Credit Reports: TransUnion report list, report picker, account list, and account detail with payment history.",
        caption: "Credit Reports: bureau selection, account list, and per-account history.",
        width: 1701,
        height: 879,
        wide: true,
      },
      {
        src: "/images/case-studies/progrexion/lexington-law-reportwatch.avif",
        alt: "Lexington Law utility and rent reporting: confirmation that utilities are being reported to Equifax, payments dashboard, and individual payment detail.",
        caption: "Utility and rent reporting: a positive tradeline, not just dispute work.",
        width: 1196,
        height: 1123,
        wide: true,
      },
    ],
  },
  {
    slug: "credit-com",
    title: "Credit.com Platform & ExtraCredit Launch",
    thumbnailLabel: "Credit.com",
    overview:
      "Led UX and product design across Credit.com's web and mobile platforms, from the core free credit score and Credit Report Card to the launch of ExtraCredit, a premium membership tier. Built design systems and documentation to support scalable design execution across a growing team.",
    highlights: [
      { term: "Streamlined Credit Report Card UX", body: "Redesigned to surface actionable insights and reduce cognitive load. Users could quickly see their score, what affected it, and what to do next." },
      { term: "Clearer Onboarding & Progress Indicators", body: "Helped new users understand the value proposition and see progress sooner." },
      { term: "Free Credit Score Access", body: "Refined flows and CTAs to boost engagement and retention for returning users." },
      { term: "ExtraCredit Product Tier", body: "Designed and launched the premium experience with five core benefits: Track It (daily credit report monitoring), Build It (rent and utility payment reporting), Reward It (cashback offers), Guard It (identity theft protection), and Restore It (credit repair partner integrations)." },
      { term: "Responsive Web Design", body: "Seamless experiences across mobile and desktop for all user tiers." },
    ],
    outcomes: [
      "Increased activation and retention for free users engaging with their credit score and report card",
      "Successful launch of ExtraCredit with strong early adoption and upsell performance",
      "Improved user satisfaction, reflected in feedback and behavior metrics post-launch",
    ],
    images: [
      {
        src: "/images/case-studies/progrexion/credit-com-extracredit.avif",
        alt: "Credit.com and ExtraCredit mobile: Welcome with FICO 802, Track IT score history, Guard IT identity threat level, and Build IT rent/utility reporting.",
        caption: "Credit.com & ExtraCredit: Track It, Guard It, and Build It premium tiers.",
        width: 2048,
        height: 1056,
        wide: true,
      },
    ],
  },
];
