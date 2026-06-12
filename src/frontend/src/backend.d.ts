import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ShopItem {
    id: string;
    name: string;
    description: string;
    effect: string;
    xpCost: bigint;
}
export type UserId = Principal;
export type Timestamp = bigint;
export interface QuestProgress {
    status: QuestStatus;
    completedAt?: Timestamp;
    xpReward: bigint;
    questId: string;
}
export interface Experience {
    title: string;
    endDate: string;
    description: string;
    company: string;
    startDate: string;
}
export interface CoverLetter {
    id: bigint;
    owner: UserId;
    body: string;
    createdAt: Timestamp;
    tone: string;
    shareToken: ShareToken;
    updatedAt: Timestamp;
    company: string;
    jobTitle: string;
}
export interface Resume {
    id: bigint;
    owner: UserId;
    name: string;
    createdAt: Timestamp;
    shareToken: ShareToken;
    email: string;
    summary: string;
    updatedAt: Timestamp;
    phone: string;
    experiences: Array<Experience>;
    skills: Array<string>;
}
export type CareerLevel = bigint;
export interface InterviewNote {
    id: bigint;
    question: string;
    sessionDate: Timestamp;
    owner: UserId;
    createdAt: Timestamp;
    role: string;
    answer: string;
    score?: bigint;
}
export interface UserProfile {
    id: UserId;
    careerLevel: CareerLevel;
    totalXp: bigint;
    lastLocation: string;
    inventory?: Array<string>;
    createdAt: Timestamp;
    lastUpdated: Timestamp;
    levelTitle: string;
}
export type ShareToken = string;
export enum QuestStatus {
    notStarted = "notStarted",
    completed = "completed",
    inProgress = "inProgress"
}
export interface backendInterface {
    createCoverLetter(jobTitle: string, company: string, body: string, tone: string): Promise<CoverLetter>;
    createInterviewNote(sessionDate: Timestamp, role: string, question: string, answer: string, score: bigint | null): Promise<InterviewNote>;
    createResume(name: string, email: string, phone: string, summary: string, experiences: Array<Experience>, skills: Array<string>): Promise<Resume>;
    deleteCoverLetter(id: bigint): Promise<boolean>;
    deleteInterviewNote(id: bigint): Promise<boolean>;
    deleteResume(id: bigint): Promise<boolean>;
    generateCoverLetter(jobTitle: string, company: string, background: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getCoverLetter(id: bigint): Promise<CoverLetter | null>;
    getCoverLetterByToken(token: ShareToken): Promise<CoverLetter | null>;
    getInterviewNote(id: bigint): Promise<InterviewNote | null>;
    getMyProfile(): Promise<UserProfile>;
    getPlayerProfile(): Promise<UserProfile>;
    getResume(id: bigint): Promise<Resume | null>;
    getResumeByToken(token: ShareToken): Promise<Resume | null>;
    interviewQuestion(jobTitle: string, category: string, previousQuestion: string | null, userAnswer: string | null): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    listCoverLetters(): Promise<Array<CoverLetter>>;
    listInterviewNotes(): Promise<Array<InterviewNote>>;
    listQuests(): Promise<Array<QuestProgress>>;
    listResumes(): Promise<Array<Resume>>;
    listShopItems(): Promise<Array<ShopItem>>;
    purchaseItem(itemId: string): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    recordNpcInteraction(npcId: string): Promise<UserProfile>;
    savePlayerPosition(location: string): Promise<void>;
    tailorResume(jobDescription: string, resumeText: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateCoverLetter(id: bigint, jobTitle: string, company: string, body: string, tone: string): Promise<CoverLetter | null>;
    updateInterviewNote(id: bigint, sessionDate: Timestamp, role: string, question: string, answer: string, score: bigint | null): Promise<InterviewNote | null>;
    updateResume(id: bigint, name: string, email: string, phone: string, summary: string, experiences: Array<Experience>, skills: Array<string>): Promise<Resume | null>;
    updateXP(amount: bigint): Promise<void>;
    upsertQuestProgress(questId: string, status: QuestStatus, xpReward: bigint): Promise<[QuestProgress, UserProfile]>;
}
