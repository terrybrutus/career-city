import type { NPC } from "@/types/game";

type CareerNPC = NPC & {
  gender: "male" | "female";
  interiorProximityTips?: string[];
};

export const NPCS: CareerNPC[] = [
  {
    id: "sam_sage",
    name: "SAM",
    gender: "male",
    locationId: "town_square",
    color: "#39ff14",
    sprite: "S",
    spriteKey: "npc_sam",
    proximityTips: [
      "Start with one useful step.",
      "Preparation turns uncertainty into choices.",
    ],
    dialogue: [
      {
        speaker: "SAM",
        text: "Welcome to Career City. This chapter is a preparation journey, not a checklist: learn the opportunity, build evidence, choose a tool, practice, then meet Ed.",
      },
      {
        speaker: "SAM",
        text: "Begin at Vera's Resume Tailor. On desktop use WASD or arrows and E, Enter, or Space to interact. On touchscreens use the joystick and Interact button.",
      },
    ],
  },
  {
    id: "vera_hr",
    name: "VERA",
    gender: "female",
    locationId: "resume_tailor",
    color: "#ff00ff",
    sprite: "V",
    spriteKey: "npc_vera",
    proximityTips: ["A strong resume proves impact with specific evidence."],
    interiorProximityTips: [
      "Bring a target role and your real experience. We will connect them.",
    ],
    dialogue: [
      {
        speaker: "VERA",
        text: "Come inside the Resume Tailor when you are ready. I will help turn your real experience into a saved resume artifact.",
      },
      {
        speaker: "VERA",
        text: "When we finish, I will place the saved resume in your Backpack so Penny, Chad, and Ed can build on it.",
      },
    ],
  },
  {
    id: "felix_shop",
    name: "FELIX",
    gender: "male",
    locationId: "item_shop",
    color: "#8844ff",
    sprite: "F",
    spriteKey: "npc_felix",
    proximityTips: ["Choose tools that support a specific preparation goal."],
    interiorProximityTips: [
      "Career Tokens buy preparation tools without reducing lifetime XP.",
    ],
    dialogue: [
      {
        speaker: "FELIX",
        text: "Come inside the shop after Vera helps with your resume. We will pick one preparation tool that supports the story you want Ed to remember.",
      },
    ],
  },
  {
    id: "chad_coach",
    name: "CHAD",
    gender: "male",
    locationId: "interview_coach",
    color: "#ffaa00",
    sprite: "C",
    spriteKey: "npc_chad",
    proximityTips: ["Practice makes your strongest examples easier to recall."],
    interiorProximityTips: [
      "Use STAR as a guide, then make the answer sound like you.",
    ],
    dialogue: [
      {
        speaker: "CHAD",
        text: "Meet me inside when your Backpack has resume evidence. We will turn one achievement into a practiced STAR story and save the coaching note.",
      },
    ],
  },
  {
    id: "penny_writer",
    name: "PENNY",
    gender: "female",
    locationId: "cover_letter_corner",
    color: "#00ffff",
    sprite: "P",
    spriteKey: "npc_penny",
    proximityTips: ["Connect your evidence to the employer's real need."],
    interiorProximityTips: [
      "Specific examples make a cover letter feel human.",
    ],
    dialogue: [
      {
        speaker: "PENNY",
        text: "Come inside the Writing Parlor after Vera saves your resume. I will build from what is already in your Backpack instead of making you retype it.",
      },
    ],
  },
  {
    id: "ed_recruiter",
    name: "ED",
    gender: "male",
    locationId: "town_square",
    color: "#c0c0c0",
    sprite: "E",
    spriteKey: "npc_ed",
    proximityTips: [
      "Recruiters remember clear evidence and thoughtful questions.",
    ],
    dialogue: [
      {
        speaker: "ED",
        text: "I help candidates turn preparation into a clear application story. When your resume and interview badge are ready, I can run a friendly recruiter simulation.",
        options: [
          { label: "SHOW CAREER PASSPORT", action: "open_recruiter" },
          { label: "KEEP PREPARING", action: "close" },
        ],
      },
    ],
  },
];
