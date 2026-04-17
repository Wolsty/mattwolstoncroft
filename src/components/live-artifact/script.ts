/**
 * LabNotes live-artifact script — chemistry, electron configuration of Iron.
 * Text pulled verbatim from the portfolio brief (three tech moments §2).
 * Do NOT rewrite the content of the lines — only timing/rendering details
 * are tunable in the component.
 */

export type Turn =
  | { role: "student"; text: string }
  | { role: "tutor"; text: string };

export const CHEMISTRY_SCRIPT: Turn[] = [
  {
    role: "student",
    text: "What's the electron configuration of Iron (Fe)?",
  },
  {
    role: "tutor",
    text: "Before I help you get there — what's iron's atomic number?",
  },
  {
    role: "student",
    text: "26",
  },
  {
    role: "tutor",
    text:
      "Good. So we need to place 26 electrons in the right order.\n" +
      "Want to work it out using the Aufbau order, or would noble gas\n" +
      "shorthand be easier from here?",
  },
  {
    role: "student",
    text: "Aufbau",
  },
  {
    role: "tutor",
    text:
      "Great. What's the first orbital you'd fill, and how many\n" +
      "electrons go in it?",
  },
  {
    role: "student",
    text: "1s²",
  },
  {
    role: "tutor",
    text: "Perfect — 2 down, 24 to go. What comes next?",
  },
  {
    role: "student",
    text: "2s² 2p⁶",
  },
  {
    role: "tutor",
    text: "Nice. You're at 10 electrons. Keep going.",
  },
  {
    role: "student",
    text: "3s² 3p⁶ 4s² 3d⁶",
  },
  {
    role: "tutor",
    text:
      "That's it — you built the full configuration yourself:\n" +
      "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d⁶\n\n" +
      "One thing worth noticing: I never gave you the answer.\n" +
      "You reasoned through it. That's the point.",
  },
];
