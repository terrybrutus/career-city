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
  public shared ({ caller }) func listQuests() : async [QuestTypes.QuestProgress] {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous callers not allowed") };
    QuestLib.list(quests, caller);
  };

  public shared ({ caller }) func upsertQuestProgress(
    questId : Text,
    status : QuestTypes.QuestStatus,
    xpReward : Nat
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
