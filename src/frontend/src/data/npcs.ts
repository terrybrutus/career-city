import type { NPC } from "@/types/game";

// Each NPC has exterior proximityTips (shown outside) and
// interiorProximityTips (shown inside their building, completely different lines).
export const NPCS: (NPC & {
  gender: "male" | "female";
  interiorProximityTips?: string[];
})[] = [
  {
    id: "ed_recruiter",
    name: "ED",
    gender: "male" as const,
    locationId: "town_square",
    color: "#C0C0C0",
    sprite: "🗺️",
    spriteKey: "npc_ed",
    questId: "quest_004",
    xpReward: 50,
    proximityTips: [
      "The job market is great if you're a robot.",
      "I'm not lost, I'm networking.",
      "Coffee and persistence. That's the whole secret.",
    ],
    dialogue: [
      {
        speaker: "ED",
        text: "Oh hey! I'm Ed. I just wander around here thinking about my career. You should try the Resume Tailor — it's magic.",
        options: [
          {
            label: "[ACCEPT QUEST]",
            action: "accept_quest",
            payload: "quest_004",
          },
          { label: "[THANKS, ED]", action: "decline" },
        ],
      },
      {
        speaker: "ED",
        text: "Pro tip: Tailoring your resume for each job increases callbacks by 3x. I read that somewhere. Or made it up. Either way, it's true.",
      },
      {
        speaker: "ED",
        text: "The Interview Coach changed my life. Well, I'm still wandering around a pixelated town, but emotionally I'm in a better place.",
      },
      {
        speaker: "ED",
        text: "You know what they say: networking is just making friends who might hire you someday. Try the buildings — they're friendlier than they look.",
      },
      {
        speaker: "ED",
        text: "I've been wandering this town for what feels like years. Best career advice I have: just keep moving.",
      },
    ],
  },
  {
    id: "vera_hr",
    name: "VERA",
    gender: "female" as const,
    locationId: "resume_tailor",
    color: "#C0C0C0",
    sprite: "📋",
    spriteKey: "npc_vera",
    questId: "quest_001",
    xpReward: 100,
    proximityTips: [
      "Psst — your resume has Comic Sans, doesn't it?",
      "I can smell a formatting error from 10 feet away.",
      "Your career story deserves better than bullet points.",
    ],
    interiorProximityTips: [
      "Another resume in need of rescue. Let's see what disaster we're working with.",
      "Every thread of experience matters. Even the ones from that startup that pivoted three times.",
      "A good resume is like a well-fitted suit. Let me take your measurements.",
    ],
    dialogue: [
      {
        speaker: "VERA",
        text: "Ah, a resume. The sacred document that pretends a human is a list of achievements.",
        options: [
          { label: "[MEET ME INSIDE]", action: "close" },
          { label: "[I'M FINE]", action: "decline" },
        ],
      },
      {
        speaker: "VERA",
        text: "Spoiler: you are not just a list of achievements. But please, keep lying for the recruiter.",
      },
    ],
  },
  {
    id: "chad_coach",
    name: "CHAD",
    gender: "male" as const,
    locationId: "interview_coach",
    color: "#C0C0C0",
    sprite: "🎤",
    spriteKey: "npc_chad",
    questId: "quest_003",
    xpReward: 150,
    proximityTips: [
      "You call that a handshake? I've seen better from accountants.",
      "Eye contact. Remember it.",
      "Confidence is free. Unfortunately, so is arrogance.",
    ],
    interiorProximityTips: [
      "The interview starts before you sit down. Posture, eye contact, all of it.",
      "I've heard 'I'm a perfectionist' as a weakness so many times it's become my phobia.",
      "They're not just interviewing you. You're interviewing them. Remember that.",
    ],
    dialogue: [
      {
        speaker: "CHAD",
        text: "I used to interview for Google. Then I became an NPC. Life is funny like that.",
        options: [
          {
            label: "[MEET ME INSIDE]",
            action: "close",
          },
          { label: "[WALK AWAY]", action: "decline" },
        ],
      },
      {
        speaker: "CHAD",
        text: "The secret to interviews? Confidence. Fake it until your stock options vest.",
      },
    ],
  },
  {
    id: "penny_writer",
    name: "PENNY",
    gender: "female" as const,
    locationId: "cover_letter_corner",
    color: "#C0C0C0",
    sprite: "✍️",
    spriteKey: "npc_penny",
    questId: "quest_002",
    xpReward: 75,
    proximityTips: [
      "A cover letter is a love letter to a job you don't have yet.",
      "I've read 10,000 cover letters. Yours will be different. Maybe.",
      "First impressions are permanent. No pressure.",
    ],
    interiorProximityTips: [
      "A cover letter should make them want to meet you, not wonder why you applied.",
      "I once wrote a cover letter so good, the hiring manager quit and gave me their job. True story.",
      "Generic cover letters are my nemesis. Tell me about you — not 'I am a passionate team player.'",
    ],
    dialogue: [
      {
        speaker: "PENNY",
        text: "A cover letter! The art of writing 3 paragraphs to say 'please hire me, I am a person.'",
        options: [
          {
            label: "[MEET ME INSIDE]",
            action: "close",
          },
          { label: "[LEAVE]", action: "decline" },
        ],
      },
      {
        speaker: "PENNY",
        text: "Pro tip: do not mention your passion for 'synergistic growth opportunities.' I beg of you.",
      },
    ],
  },
  {
    id: "felix_shop",
    name: "FELIX",
    gender: "male" as const,
    locationId: "item_shop",
    color: "#C0C0C0",
    sprite: "🏅",
    spriteKey: "npc_felix",
    questId: "quest_005",
    xpReward: 50,
    proximityTips: [
      "Everything here is on sale. Except dignity.",
      "Browse at your own risk. I don't do refunds.",
      "Looking for something? Or just window shopping your future?",
    ],
    interiorProximityTips: [
      "Everything here is legal. The 'Confidence Elixir' is just confidence. Mostly.",
      "Resume Boost Potion: 50 XP. Not getting the job because your resume sucked: priceless.",
      "I also accept compliments as currency. Just kidding. I don't.",
    ],
    dialogue: [
      {
        speaker: "FELIX",
        text: "Badges, huh? Collecting proof you did things. Very adult Pokemon of you.",
        options: [
          { label: "[BROWSE SHOP]", action: "close" },
          { label: "[LEAVE]", action: "decline" },
        ],
      },
      {
        speaker: "FELIX",
        text: "I sell XP boosters, confidence potions, and LinkedIn Premium coupons. All imaginary. Good luck.",
      },
    ],
  },
  {
    id: "sam_sage",
    name: "SAM",
    gender: "male" as const,
    locationId: "town_square",
    color: "#C0C0C0",
    sprite: "🧙",
    spriteKey: "npc_sam",
    questId: "quest_006",
    xpReward: 75,
    proximityTips: [
      "These benches are ergonomically designed to make you anxious.",
      "Sitting here helps me think. Or avoid thinking.",
      "The secret to job hunting? Take breaks. Like this one.",
    ],
    dialogue: [
      {
        speaker: "SAM",
        text: "Ah, a traveler. Sit a moment. The job market is rough, but those who persist find their path.",
      },
      {
        speaker: "SAM",
        text: "I've reviewed a thousand resumes in my day. The ones that stand out? Specific achievements, not vague duties.",
      },
      {
        speaker: "SAM",
        text: "You know what's underrated? A well-written cover letter. It shows you actually care about the role.",
      },
      {
        speaker: "SAM",
        text: "Interview tip from an old hand: prepare three specific stories from your past. The STAR method never fails.",
      },
      {
        speaker: "SAM",
        text: "They say luck is when preparation meets opportunity. Get prepared at those buildings. The opportunity will come.",
      },
    ],
  },
];

const PURPOSEFUL_DIALOGUE: Record<string, NPC["dialogue"]> = {
  sam_sage: [
    { speaker: "SAM", text: "Welcome to Career City. Your first chapter is a preparation journey: build a resume credential, choose a power-up, train for an interview, then report to Ed." },
    { speaker: "SAM", text: "Start at Vera's Resume Tailor. Walk through her door, speak with her, and complete one tailoring session. Your Journey tracker updates as you progress." },
    { speaker: "SAM", text: "On desktop, move with WASD or arrows and talk with E or Enter. On touchscreens, use the joystick and INTERACT button." },
  ],
  vera_hr: [{ speaker: "VERA", text: "My workshop turns your real experience into a targeted resume credential. Enter through the door and I will guide your first session." }],
  felix_shop: [{ speaker: "FELIX", text: "This shop turns earned XP into career power-ups. Finish Vera's resume session, then come inside and choose the boost that fits your path." }],
  chad_coach: [{ speaker: "CHAD", text: "Interview training is your final preparation step. Enter the studio for a question, clear feedback, and another attempt." }],
  penny_writer: [{ speaker: "PENNY", text: "I connect your experience to a specific role in a clear cover letter. My workshop is optional in Chapter 1, but strengthens your Career Passport." }],
  ed_recruiter: [{ speaker: "ED", text: "I am the recruiter at the end of Chapter 1. Build your credential, choose a power-up, and finish interview training. Then return and show me your Career Passport." }],
};

for (const npc of NPCS) {
  const dialogue = PURPOSEFUL_DIALOGUE[npc.id];
  if (dialogue) npc.dialogue = dialogue;
}
