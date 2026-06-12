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
        text: "We will turn your experience into a targeted, saved resume artifact.",
        options: [
          {
            label: "OPEN RESUME WORKSHOP",
            action: "open_tool",
            payload: "resume-tailor",
          },
          { label: "NOT YET", action: "close" },
        ],
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
        text: "A useful loadout supports the next challenge. Your Career Tokens never reduce your lifetime XP.",
        options: [
          { label: "BUILD LOADOUT", action: "open_tool", payload: "item-shop" },
          { label: "NOT YET", action: "close" },
        ],
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
        text: "We will practice one answer, review it without penalties, and save the coaching note.",
        options: [
          {
            label: "START PRACTICE",
            action: "open_tool",
            payload: "interview-coach",
          },
          { label: "NOT YET", action: "close" },
        ],
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
        text: "This optional workshop creates a saved, role-specific cover letter.",
        options: [
          {
            label: "OPEN WRITING DESK",
            action: "open_tool",
            payload: "cover-letter",
          },
          { label: "NOT YET", action: "close" },
        ],
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
