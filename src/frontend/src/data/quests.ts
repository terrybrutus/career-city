import type { QuestDefinition } from "@/types/game";

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  {
    id: "quest_001",
    title: "THE RESUME CHALLENGE",
    description:
      "Visit Resume Tailor and craft an ATS-compliant resume. Vera will judge it. Mercilessly.",
    locationId: "resume_tailor",
    xpReward: 100,
  },
  {
    id: "quest_002",
    title: "DEAR FUTURE EMPLOYER",
    description:
      "Write a cover letter. Three paragraphs. 'I am a person who can do things.' XP awaits.",
    locationId: "cover_letter_corner",
    xpReward: 75,
  },
  {
    id: "quest_003",
    title: "THE HOT SEAT",
    description:
      "Complete one full interview practice session without saying 'um' more than twelve times.",
    locationId: "interview_coach",
    xpReward: 150,
  },
  {
    id: "quest_004",
    title: "FIRST CONTACT",
    description:
      "Talk to all five NPCs in Career City. They have opinions. Largely unwanted. Earn XP anyway.",
    locationId: "town_square",
    xpReward: 50,
  },
  {
    id: "quest_005",
    title: "CAREER EXPLORER",
    description:
      "Visit every building in Career City. Curiosity is a career skill. Allegedly.",
    locationId: "town_square",
    xpReward: 50,
  },
];

export function getQuestById(id: string): QuestDefinition | undefined {
  return QUEST_DEFINITIONS.find((q) => q.id === id);
}
