export type MissionId =
  | "pack_for_the_journey"
  | "meet_sam"
  | "visit_resume_tailor"
  | "craft_resume"
  | "visit_item_shop"
  | "choose_power_up"
  | "practice_interview"
  | "craft_cover_letter"
  | "meet_everyone"
  | "explore_every_building"
  | "path_engineering"
  | "path_product"
  | "path_operations"
  | "chapter_one_complete";

export interface MissionDefinition {
  id: MissionId;
  title: string;
  objective: string;
  reward: number;
  chapter: number;
  optional?: boolean;
}

export const MISSIONS: readonly MissionDefinition[] = [
  {
    id: "pack_for_the_journey",
    title: "Pack for the Journey",
    objective: "Find your Backpack at home and take it with you.",
    reward: 25,
    chapter: 1,
  },
  {
    id: "meet_sam",
    title: "Meet Your Guide",
    objective: "Talk with Sam in Career Commons.",
    reward: 25,
    chapter: 1,
  },
  {
    id: "visit_resume_tailor",
    title: "Enter Vera's Workshop",
    objective: "Walk through the Resume Tailor door.",
    reward: 25,
    chapter: 1,
  },
  {
    id: "craft_resume",
    title: "Craft a Targeted Resume",
    objective: "Complete Vera's guided resume challenge and save the result.",
    reward: 100,
    chapter: 1,
  },
  {
    id: "visit_item_shop",
    title: "Meet Felix",
    objective: "Visit Felix's shop and review the available preparation tools.",
    reward: 25,
    chapter: 1,
  },
  {
    id: "choose_power_up",
    title: "Prepare Your Loadout",
    objective: "Choose one Career Token power-up for your application.",
    reward: 50,
    chapter: 1,
  },
  {
    id: "practice_interview",
    title: "Practice a STAR Story",
    objective: "Complete one coached interview answer and save the feedback.",
    reward: 100,
    chapter: 1,
  },
  {
    id: "chapter_one_complete",
    title: "Recruiter Encounter",
    objective: "Return to Ed and demonstrate your preparation.",
    reward: 200,
    chapter: 1,
  },
  {
    id: "craft_cover_letter",
    title: "Make the Connection",
    objective: "Create and save a role-specific cover letter with Penny.",
    reward: 75,
    chapter: 1,
    optional: true,
  },
  {
    id: "meet_everyone",
    title: "Build Your Network",
    objective: "Introduce yourself to every Career City mentor.",
    reward: 75,
    chapter: 1,
    optional: true,
  },
  {
    id: "explore_every_building",
    title: "Career City Explorer",
    objective: "Visit every open workshop.",
    reward: 75,
    chapter: 1,
    optional: true,
  },
  {
    id: "path_engineering",
    title: "Engineering Path",
    objective: "Replay challenges with an impact-and-systems focus.",
    reward: 0,
    chapter: 2,
    optional: true,
  },
  {
    id: "path_product",
    title: "Product Path",
    objective: "Replay challenges with a customer-and-outcomes focus.",
    reward: 0,
    chapter: 2,
    optional: true,
  },
  {
    id: "path_operations",
    title: "Operations Path",
    objective: "Replay challenges with a process-and-reliability focus.",
    reward: 0,
    chapter: 2,
    optional: true,
  },
];

export const CHAPTER_ONE = MISSIONS.filter((mission) => !mission.optional);
export const missionById = (id: string) =>
  MISSIONS.find((mission) => mission.id === id);
