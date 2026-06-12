import Map "mo:core/Map";
import List "mo:core/List";
import QuestLib "../lib/quest";
import ProfileLib "../lib/profile";
import QuestTypes "../types/quest";
import CommonTypes "../types/common";
import ProfileTypes "../types/profile";
import Runtime "mo:core/Runtime";

mixin (
  quests : Map.Map<CommonTypes.UserId, List.List<QuestTypes.QuestProgress>>,
  profiles : Map.Map<CommonTypes.UserId, ProfileTypes.UserProfile>
) {
  func rewardFor(questId : Text) : Nat {
    if (questId == "pack_for_the_journey") { 25 }
    else if (questId == "meet_sam") { 25 }
    else if (questId == "visit_resume_tailor") { 25 }
    else if (questId == "craft_resume") { 100 }
    else if (questId == "visit_item_shop") { 25 }
    else if (questId == "choose_power_up") { 50 }
    else if (questId == "practice_interview") { 100 }
    else if (questId == "craft_cover_letter") { 75 }
    else if (questId == "meet_everyone") { 75 }
    else if (questId == "explore_every_building") { 75 }
    else if (questId == "chapter_one_complete") { 200 }
    else { 0 };
  };

  public shared ({ caller }) func listQuests() : async [QuestTypes.QuestProgress] {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous callers not allowed") };
    QuestLib.list(quests, caller);
  };

  public shared ({ caller }) func upsertQuestProgress(
    questId : Text,
    status : QuestTypes.QuestStatus,
    _requestedReward : Nat
  ) : async (QuestTypes.QuestProgress, ProfileTypes.UserProfile) {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous callers not allowed") };
    let wasCompleted = switch (quests.get(caller)) {
      case null { false };
      case (?existing) {
        switch (existing.find(func(q) { q.questId == questId })) {
          case (?quest) {
            switch (quest.status) {
              case (#completed) { true };
              case (_) { false };
            };
          };
          case null { false };
        };
      };
    };
    let xpReward = rewardFor(questId);
    let progress = QuestLib.upsert(quests, caller, questId, status, xpReward);
    ignore ProfileLib.getOrCreate(profiles, caller);
    let profile = switch (status) {
      case (#completed) {
        if (wasCompleted) {
          ProfileLib.getOrCreate(profiles, caller)
        } else {
          ProfileLib.addXp(profiles, caller, xpReward)
        }
      };
      case (_) { ProfileLib.getOrCreate(profiles, caller) };
    };
    (progress, profile);
  };
};
