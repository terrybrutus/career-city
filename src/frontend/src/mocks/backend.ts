import type { backendInterface, QuestProgress, UserProfile, Resume, CoverLetter, InterviewNote } from "../backend";
import { QuestStatus } from "../backend";
import { Principal } from "@icp-sdk/core/principal";

const samplePrincipal = Principal.anonymous();
const now = BigInt(Date.now()) * BigInt(1_000_000);

const sampleResume: Resume = {
  id: BigInt(1),
  owner: samplePrincipal,
  name: "Alex Rivera",
  email: "alex@careercity.io",
  phone: "555-0101",
  summary: "Experienced software engineer passionate about building great products.",
  experiences: [
    {
      title: "Senior Engineer",
      company: "Tech Corp",
      startDate: "2021-01",
      endDate: "Present",
      description: "Led development of core platform features.",
    },
  ],
  skills: ["TypeScript", "React", "Motoko"],
  shareToken: "resume-token-1",
  createdAt: now,
  updatedAt: now,
};

const sampleCoverLetter: CoverLetter = {
  id: BigInt(1),
  owner: samplePrincipal,
  jobTitle: "Frontend Engineer",
  company: "Acme Inc",
  body: "Dear Hiring Manager, I am excited to apply for this role...",
  tone: "professional",
  shareToken: "cover-token-1",
  createdAt: now,
  updatedAt: now,
};

const sampleInterviewNote: InterviewNote = {
  id: BigInt(1),
  owner: samplePrincipal,
  role: "Software Engineer",
  question: "Tell me about a challenging project you worked on.",
  answer: "I led a team migration from monolith to microservices...",
  score: BigInt(8),
  sessionDate: now,
  createdAt: now,
};

const sampleQuest: QuestProgress = {
  questId: "create-first-resume",
  status: QuestStatus.inProgress,
  xpReward: BigInt(50),
  completedAt: undefined,
};

const sampleProfile: UserProfile = {
  id: samplePrincipal,
  careerLevel: BigInt(3),
  totalXp: BigInt(150),
  lastLocation: "town_square",
  levelTitle: "Junior Developer",
  createdAt: now,
  lastUpdated: now,
};

export const mockBackend: backendInterface = {
  createCoverLetter: async () => sampleCoverLetter,
  createInterviewNote: async () => sampleInterviewNote,
  createResume: async () => sampleResume,
  deleteCoverLetter: async () => true,
  deleteInterviewNote: async () => true,
  deleteResume: async () => true,
  getCoverLetter: async () => sampleCoverLetter,
  getCoverLetterByToken: async () => sampleCoverLetter,
  getInterviewNote: async () => sampleInterviewNote,
  getMyProfile: async () => sampleProfile,
  getResume: async () => sampleResume,
  getResumeByToken: async () => sampleResume,
  listCoverLetters: async () => [sampleCoverLetter],
  listInterviewNotes: async () => [sampleInterviewNote],
  listQuests: async () => [sampleQuest],
  listResumes: async () => [sampleResume],
  recordNpcInteraction: async () => sampleProfile,
  savePlayerPosition: async () => undefined,
  updateCoverLetter: async () => sampleCoverLetter,
  updateInterviewNote: async () => sampleInterviewNote,
  updateResume: async () => sampleResume,
  upsertQuestProgress: async () => [sampleQuest, sampleProfile],
  tailorResume: async () => ({ __kind__: "ok" as const, ok: "Mock tailored resume advice: Focus on quantifiable achievements and align your skills with the job requirements. Use action verbs and specific metrics." }),
  generateCoverLetter: async () => ({ __kind__: "ok" as const, ok: "Dear Hiring Manager,\n\nI am excited to apply for this position. With my background in the field, I bring a unique combination of skills and experience that would make me a valuable addition to your team.\n\nThank you for your consideration.\n\nSincerely,\nYour Name" }),
  getPlayerProfile: async () => sampleProfile,
  listShopItems: async () => [],
  purchaseItem: async () => ({ __kind__: "ok" as const, ok: true }),
  updateXP: async () => undefined,
  interviewQuestion: async (_jobTitle, _category, _prevQ, userAnswer) => {
    if (userAnswer) {
      return { __kind__: "ok" as const, ok: "Strong answer! You demonstrated clear problem-solving skills and the ability to reflect on your experience. To improve: be more specific about the measurable impact of your solution, and mention what you'd do differently next time." };
    }
    return { __kind__: "ok" as const, ok: "Tell me about a time you had to overcome a significant technical challenge. What was your approach and what did you learn from it?" };
  },
};
