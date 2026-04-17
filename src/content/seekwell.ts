/**
 * SeekWell / HelloEyes — four sub-case studies, pulled verbatim from
 * /docs/case-studies-content.md (sections 1-4) per the brief's content
 * reuse rules.
 *
 * Rendering order on /seekwell index and case-to-case PrevNext navigation:
 *   1. ios-android-apps
 *   2. diary-study
 *   3. vision-assessment
 *   4. ai-vision-exam
 */

export type SeekwellSection =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: Array<{ term?: string; body: string }> };

export type SeekwellImage = { src: string; alt: string };

export type SeekwellCase = {
  slug: string;
  title: string;
  thumbnailLabel: string; // small-caps label on /seekwell index
  blurb: string; // one-line tension for the index list
  metadata: string[];
  sections: SeekwellSection[];
  images?: SeekwellImage[];
};

export const SEEKWELL_CASES: SeekwellCase[] = [
  {
    slug: "ios-android-apps",
    title: "HelloEyes iOS & Android Apps",
    thumbnailLabel: "iOS & Android Apps · HelloEyes",
    blurb:
      "Turning a smartphone into a virtual vision center. Six flows, measured lift on each.",
    metadata: [
      "2023 — 2024",
      "Principal Designer",
      "iOS · Android",
      "HIPAA-grade Auth · Computer Vision",
      "Shipped",
    ],
    sections: [
      { kind: "heading", text: "Overview" },
      {
        kind: "paragraph",
        text:
          "HelloEyes is a first of its kind mobile vision platform that transforms your smartphone into a comprehensive virtual vision center, offering at-home vision exams, prescription tools, and seamless eyewear ordering, all powered by AI and conversational design. Built for accessibility, speed, and trust, the app helps users manage their eye health without stepping into a clinic.",
      },
      { kind: "heading", text: "My Role" },
      {
        kind: "list",
        items: [
          {
            term: "Product Design & UX Optimization",
            body:
              "Led the design of critical flows across iOS and Android, including account creation and post-exam order pairing, to reduce friction, boost conversion, and reinforce trust.",
          },
          {
            term: "Research-Driven Redesign",
            body:
              "Conducted usability testing and funnel analysis to identify and solve onboarding drop-offs. Redefined the account creation experience with real-time feedback, password strength indicators, and progressive disclosure, resulting in a 22% lift in successful sign-ups.",
          },
          {
            term: "Journey Mapping & Conversion Strategy",
            body:
              "Identified a key post-exam blind spot and designed an in-app prescription pairing flow with smart nudges and contextual CTAs. This solution increased Rx-to-order attachment by over 50% and addressed a major abandonment issue.",
          },
          {
            term: "Platform Leadership",
            body:
              "Shaped the mobile experience to reflect HelloEyes' core principles of accessibility, speed, and trust, positioning the app as a first-of-its-kind virtual vision center.",
          },
        ],
      },
      { kind: "heading", text: "Flows covered" },
      {
        kind: "list",
        items: [
          {
            term: "Order Pairing Flow",
            body:
              "Eliminate friction between obtaining a digital Rx and applying it to a product order. Solved a critical post-exam drop-off: users not knowing how to apply their new Rx to an eyewear purchase. Mapped the blind spot and designed a frictionless in-app mechanism to surface eligible orders and pair the prescription directly. Result: reduced Rx abandonment and improved attachment rate by over 50%.",
          },
          {
            term: "Lens Scanner Tool (Landing Page, Tool Flow, FAQs)",
            body:
              "Enable users to retrieve their glasses prescription from home. Proprietary feature that lets users scan their existing glasses to extract their prescription. Designed a benefits-first landing page, intuitive setup walkthroughs, and FAQ content informed by real-time support inquiries. Integrated user testing at every stage (calibration through results). Result: reduced task abandonment by 38%. Became one of the highest-engaged features, especially for returning customers.",
          },
          {
            term: "PD Reader (Pupillary Distance Tool)",
            body:
              "Empower users to self-measure PD for accurate glasses fitting. Designed a computer vision–assisted flow that guides users through capturing their PD using their phone and a credit card for scale. Focused on trust building through transparent measurement logic, real-time visual feedback, and simplified instructions. Result: 33% increase in successful PD captures and a 27% decrease in order returns due to fit issues.",
          },
          {
            term: "Account Creation",
            body:
              "Simplify onboarding and reduce barriers while maintaining security and trust. Complete redesign to reduce drop-offs and align with HIPAA-grade security standards. Identified cognitive load and unclear password requirements as friction points. Implemented real-time validation, visual password strength indicators, and progressive disclosure. Result: 22% lift in successful account creation.",
          },
          {
            term: "Password Reset Flow",
            body:
              "Ensure users can recover access quickly and confidently. Mapped the end-to-end recovery journey from reset request through reauthentication. Enhancements: clear, empathetic microcopy and inline error validation for real-time feedback. Result: 40% increase in successful reset completions and a 32% drop in login-related support tickets.",
          },
          {
            term: "Checkout & Payment for Vision Exam",
            body:
              "Minimize cart abandonment and build confidence in paying for a novel health service. Barriers uncovered: unclear value proposition, limited payment options, vague refund policies. Redesign added credibility (testimonials, guarantees), modern payment methods, and clarified post-purchase steps. Result: reduced checkout abandonment and increased conversion by 22% within the first two release cycles.",
          },
        ],
      },
    ],
    images: [
      {
        src: "/images/case-studies/seekwell/hC5kiBAHXbyBa1URDc7h1WXdrk.webp",
        alt: "HelloEyes product catalog — women's eyeglasses grid browsing on mobile.",
      },
      {
        src: "/images/case-studies/seekwell/SHGChn0d5MNLhIKURMp4QRL7Ptg.webp",
        alt: "Checkout flow — order review and payment on the HelloEyes app.",
      },
      {
        src: "/images/case-studies/seekwell/89lOHTMGpOvoBwwMOLfsZxhqcx8.webp",
        alt: "Post-exam prescription confirmation — the \"all done\" state of the Rx pairing flow.",
      },
    ],
  },
  {
    slug: "diary-study",
    title: "Diary Study — Large Scale Usability Study",
    thumbnailLabel: "Large Scale Usability · Study",
    blurb:
      "A multi-month diary study across the end-to-end glasses ordering experience — what it revealed about trust, tool stability, and where to invest next.",
    metadata: [
      "2023",
      "Research Lead",
      "Longitudinal Diary Study",
      "Cross-Functional Synthesis",
      "Shipped",
    ],
    sections: [
      { kind: "heading", text: "Overview" },
      {
        kind: "paragraph",
        text:
          "Over the course of several months, we ran a large scale diary study to understand the usability, stability, and overall satisfaction of our glasses ordering experience. Our goal was to uncover friction points across different parts of the journey, particularly with newer tools like our Vision Exam and Lens Scanner.",
      },
      { kind: "heading", text: "My Role" },
      {
        kind: "list",
        items: [
          {
            term: "Research Strategy & Execution",
            body:
              "Led the design and implementation of a multi-month diary study to evaluate the end-to-end glasses ordering experience, focusing on usability, trust, and tool performance.",
          },
          {
            term: "Insight Synthesis",
            body:
              "Analyzed longitudinal feedback to uncover key friction points, particularly around the Vision Exam and Lens Scanner, and identified areas of strength in the shopping and prescription upload flows.",
          },
          {
            term: "Product Impact",
            body:
              "Translated findings into actionable updates across product, content, and engineering, influencing redesign priorities, stability improvements, and help content expansion.",
          },
        ],
      },
      { kind: "heading", text: "Key Insights" },
      {
        kind: "list",
        items: [
          {
            term: "Vision Exam Confusion",
            body:
              "Several users expressed uncertainty about the Vision Exam's credibility compared to traditional exams.",
          },
          {
            term: "Lens Scanner Limitations",
            body:
              "Technical hiccups in the Lens Scanner tool led to frustration and drop off for a small subset of users.",
          },
          {
            term: "Shopping Flow Strength",
            body:
              "Participants responded positively to the frame discovery experience, citing ease of browsing and filtering options.",
          },
          {
            term: "Prescription Upload Simplicity",
            body:
              "Users who uploaded an existing prescription found the process straightforward and frictionless.",
          },
        ],
      },
      { kind: "heading", text: "Outcomes" },
      {
        kind: "list",
        items: [
          { body: "Redesign efforts were prioritized for the Vision Exam flow to better educate users upfront." },
          { body: "Lens Scanner tool stability was improved based on technical feedback." },
          { body: "Minor copy and layout updates were made to the shopping and checkout experience." },
          { body: "Help content and FAQs were expanded to proactively address common user questions." },
        ],
      },
    ],
    images: [
      {
        src: "/images/case-studies/seekwell/FU17fLidXjY1J7clSROV6zlEE.webp",
        alt: "Diary-study recruiting screen — the \"Join our test group\" call to action shown to users during the study.",
      },
      {
        src: "/images/case-studies/seekwell/76kbLcHfV5kqaiTB5gitURxyxc.webp",
        alt: "A participant engaging with the HelloEyes app during the multi-month diary study.",
      },
    ],
  },
  {
    slug: "vision-assessment",
    title: "Online Vision Assessment",
    thumbnailLabel: "Online · Vision Assessment",
    blurb:
      "A UX strategy disguised as a conversation — invisible qualification logic routed the right users to the right tools.",
    metadata: [
      "2023",
      "Experience Strategy",
      "Branching Content",
      "100% Value Rate",
      "+40% Qualified Leads",
    ],
    sections: [
      { kind: "heading", text: "Overview" },
      {
        kind: "paragraph",
        text:
          "The Vision Assessment was designed as an entry point into the HelloEyes ecosystem — a free, guided quiz-like experience that helped users navigate their vision needs and matched them with the right tools, styles, and services. Launched from the homepage, it acted as a digital concierge for our broader experience.",
      },
      {
        kind: "paragraph",
        text:
          "Under the surface, I strategically structured the Vision Assessment to surface qualified candidates for our AI powered vision exam, without promoting it broadly. The exam had strict eligibility requirements, and prior testing revealed user frustration when disqualified. This flow allowed us to deliver value to all users while quietly identifying and routing high-fit candidates to the exam experience. It increased product discovery, reduced bounce, and provided a more inclusive starting point for new users.",
      },
      { kind: "heading", text: "The Challenge" },
      {
        kind: "paragraph",
        text:
          "The online vision exam was one of HelloEyes' most promising offerings but with one big caveat: strict eligibility rules. Many users who clicked into it were met with rejection, causing frustration and a sharp drop in trust. We had to find a better way to introduce the experience to the right users without alienating the rest.",
      },
      {
        kind: "paragraph",
        text:
          "At the same time, we noticed an opportunity on our homepage. Bounce rates were high. New users weren't sure where to start. We needed an engaging, frictionless entry point into our ecosystem that could deliver value quickly and build confidence in our brand.",
      },
      { kind: "heading", text: "My Role" },
      {
        kind: "list",
        items: [
          { term: "Experience Strategy", body: "Positioned the assessment as a welcoming front door to our broader product ecosystem, something for everyone, not just a gatekeeper to the exam." },
          { term: "Flow Architecture & Content Design", body: "Architected the logic and branching paths to ensure the experience was smooth, helpful, and tailored. Users felt guided, not filtered." },
          { term: "Outcome-Oriented Design", body: "Every screen was crafted with the dual purpose of delivering value to the user and surfacing actionable data for the business." },
        ],
      },
      { kind: "heading", text: "Design Approach" },
      {
        kind: "list",
        items: [
          { term: "Guided Personalization", body: "Framed the assessment as a concierge-style guide. Users answered short, friendly questions about their vision history, current eyewear, goals, and lifestyle. Based on their answers, we offered curated recommendations — from trying on glasses at home to exploring contacts or scheduling an in-person exam." },
          { term: "Invisible Qualification Logic", body: "Behind the scenes, layered in logic to identify high-fit candidates for the online vision exam. Rather than asking directly, we inferred eligibility through branching questions. When users did qualify, we introduced the exam as a tailored next step. This preserved the feeling of relevance, rather than rejection." },
          { term: "Universal Value Delivery", body: "Every user, regardless of qualification, received personalized results and recommendations. This ensured no one left empty-handed, reinforcing trust and helping users feel seen." },
          { term: "Seamless Integration", body: "Launched the assessment from multiple points across the site, including the homepage, product pages, and email flows. It became a flexible touchpoint that adapted to different user intents." },
        ],
      },
      { kind: "heading", text: "Impact" },
      {
        kind: "list",
        items: [
          { term: "100% Value Rate", body: "Every user who completed the assessment received personalized, actionable results, boosting satisfaction and creating a clear next step." },
          { term: "+40% Increase in Qualified Exam Leads", body: "By routing only high-fit users to the exam, we improved conversion rates and protected NPS from the drop-off previously caused by disqualification." },
          { term: "-30% Reduction in User Frustration", body: "By removing direct promotion of the exam as a \"first touch,\" we avoided disappointment and confusion for users who wouldn't qualify." },
          { term: "Improved Homepage Engagement", body: "Users who completed the assessment were significantly more likely to explore tools, browse frames, and engage with services, making it a key driver of product discovery." },
        ],
      },
      { kind: "heading", text: "Conclusion" },
      {
        kind: "paragraph",
        text:
          "The Vision Assessment wasn't just a quiz — it was a UX strategy disguised as a conversation. By embedding qualification logic into a helpful and empathetic experience, we turned what could have been a gatekeeping tool into a welcoming guide. It became the bridge between users' vision goals and HelloEyes' full range of offerings, balancing business outcomes with trust, clarity, and value at every step.",
      },
    ],
    images: [
      {
        src: "/images/case-studies/seekwell/kCc4OvkH5MSPJvAShiHVp6zmJIQ.webp",
        alt: "Vision Assessment intake — opening question in the guided, concierge-style quiz.",
      },
      {
        src: "/images/case-studies/seekwell/4bJYHyoU8K7ZhWIyyJSQJ1tBBM.webp",
        alt: "Branching quiz step covering frame style, color, and lifestyle preferences.",
      },
      {
        src: "/images/case-studies/seekwell/VIdNOdCCfHMXbZymUjsnbptZ58.webp",
        alt: "Personalized results page returned to every assessment taker, regardless of exam eligibility.",
      },
    ],
  },
  {
    slug: "ai-vision-exam",
    title: "HelloEyes AI-Powered Vision Exam",
    thumbnailLabel: "AI-Powered Vision Exam · HelloEyes",
    blurb:
      "A mobile-first, clinically-validated exam built on voice interaction and AI. 30% completion lift within three months.",
    metadata: [
      "2024",
      "UX Strategy & Research",
      "Voice + AI + Biometric",
      "Telehealth Compliance",
      "+30% Completion Rate",
    ],
    sections: [
      { kind: "heading", text: "Overview" },
      {
        kind: "paragraph",
        text:
          "The HelloEyes Vision Exam is a mobile-first, AI-driven experience that transforms any smartphone into a clinically validated vision center, enabling users to receive a doctor-issued vision prescription from the comfort of home, with no appointment needed. This proprietary flow integrates voice interaction, AI, and biometric calibration to deliver a guided exam that meets regulatory standards for prescription eyewear, redefining access to vision care through technology.",
      },
      { kind: "heading", text: "My Role" },
      {
        kind: "list",
        items: [
          { term: "UX Strategy & Research", body: "Defined the end-to-end user journey for a digital vision exam, grounding design decisions in usability testing, interviews, and behavioral data." },
          { term: "Product Design", body: "Designed intuitive flows for prescription confirmation, vision correction tasks, and eligibility screening to maximize clarity and compliance." },
          { term: "Clinical Collaboration", body: "Partnered with optometrists and regulatory teams to ensure clinical validity and meet telehealth standards while maintaining a user-friendly experience." },
        ],
      },
      { kind: "heading", text: "Challenge" },
      {
        kind: "paragraph",
        text:
          "HelloEyes introduced an AI-powered mobile application enabling users to obtain vision prescriptions through voice interaction. Despite its innovative approach, the vision exam setup process faced significant user drop-offs due to:",
      },
      {
        kind: "list",
        items: [
          { term: "Late-stage disqualifications", body: "Users discovered ineligibility (based on age, location, or time since last exam) only after completing most of the setup." },
          { term: "Lengthy instructional videos", body: "A 43% drop-off was observed between the first (1:15) and second (0:33) videos." },
          { term: "Environmental setup issues", body: "Users struggled with finding suitable environments and faced challenges resuming interrupted setups within a strict 30 minute window." },
          { term: "Technical glitches", body: "Issues like device instability, unclear phone angle guidance, and an overly sensitive lighting gauge led to frequent exits." },
          { term: "Permission hesitancy", body: "Users were reluctant to grant necessary permissions due to unclear justifications." },
        ],
      },
      { kind: "heading", text: "Research Approach" },
      {
        kind: "list",
        items: [
          { term: "Data Analysis", body: "Reviewed user behavior metrics to identify drop-off points." },
          { term: "User Interviews", body: "Engaged with a diverse user base to gather qualitative feedback." },
          { term: "Usability Testing", body: "Observed users navigating the setup flow to pinpoint friction areas." },
        ],
      },
      { kind: "heading", text: "Key Findings" },
      {
        kind: "list",
        items: [
          { body: "Users felt frustrated upon learning about disqualification late in the process." },
          { body: "Long videos were disengaging, leading to early exits." },
          { body: "The inability to pause and resume the setup deterred users with environmental constraints." },
          { body: "Technical instructions lacked clarity, causing setup errors." },
          { body: "Permission requests lacked context, leading to user distrust." },
        ],
      },
      { kind: "heading", text: "Design Solutions" },
      {
        kind: "list",
        items: [
          { term: "Pre-Qualification Questionnaire", body: "Introduced a brief eligibility check before app download to filter out ineligible users early." },
          { term: "Instructional Content Optimization", body: "Replaced lengthy videos with concise, engaging content. Added a 'skip' option for experienced users." },
          { term: "Enhanced Resume Functionality", body: "Extended the setup window beyond 30 minutes. Implemented persistent reminders to encourage completion." },
          { term: "Improved Setup Guidance", body: "Provided real-time visual cues for phone positioning. Calibrated the lighting gauge to be more forgiving." },
          { term: "Transparent Permission Requests", body: "Included clear explanations for each permission, linking them to exam accuracy." },
        ],
      },
      { kind: "heading", text: "Results" },
      {
        kind: "list",
        items: [
          { term: "Completion Rate", body: "Increased by 30%, surpassing the 25% target within three months." },
          { term: "Video Engagement", body: "Drop-off rates decreased to 20% with shorter content." },
          { term: "Resume Functionality", body: "25% more users completed the setup after interruptions." },
          { term: "Setup Errors", body: "Device instability-related drop-offs reduced by 15%." },
          { term: "Permission Acceptance", body: "Improved by 18% due to clearer explanations." },
          { term: "Qualification Drop-offs", body: "Reduced by 35% through early eligibility checks." },
        ],
      },
      { kind: "heading", text: "Conclusion" },
      {
        kind: "paragraph",
        text:
          "By addressing key pain points through user-centered design and rigorous testing, the HelloEyes vision exam setup flow became more intuitive and efficient. This project exemplifies my commitment to enhancing user experiences through strategic research and design interventions.",
      },
    ],
    images: [
      {
        src: "/images/case-studies/seekwell/XDKW5HkRJnxNZ9r5SxVVYyD0M.webp",
        alt: "AI-powered vision exam — setup flow introducing the at-home testing environment.",
      },
      {
        src: "/images/case-studies/seekwell/WlXE79U0DPjAjBLqOyalnq2xcM.webp",
        alt: "Calibration step for the AI-powered vision exam — real-time visual guidance for phone positioning.",
      },
    ],
  },
];

export function getSeekwellCase(slug: string): SeekwellCase | undefined {
  return SEEKWELL_CASES.find((c) => c.slug === slug);
}

export function getSeekwellNeighbors(slug: string) {
  const idx = SEEKWELL_CASES.findIndex((c) => c.slug === slug);
  if (idx === -1) return { prev: undefined, next: undefined };
  return {
    prev: idx > 0 ? SEEKWELL_CASES[idx - 1] : undefined,
    next: idx < SEEKWELL_CASES.length - 1 ? SEEKWELL_CASES[idx + 1] : undefined,
  };
}
