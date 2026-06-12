import Map "mo:core/Map";
import List "mo:core/List";
import QuestTypes "../types/quest";
import CommonTypes "../types/common";
import Time "mo:core/Time";

module {
  public type QuestProgress = QuestTypes.QuestProgress;

  public func list(
    quests : Map.Map<CommonTypes.UserId, List.List<QuestTypes.QuestProgress>>,
    owner : CommonTypes.UserId
  ) : [QuestTypes.QuestProgress] {
    switch (quests.get(owner)) {
      case (?lst) { lst.toArray() };
      case null { [] };
    };
  };

  public func upsert(
    quests : Map.Map<CommonTypes.UserId, List.List<QuestTypes.QuestProgress>>,
    owner : CommonTypes.UserId,
    questId : Text,
    status : QuestTypes.QuestStatus,
    xpReward : Nat
  ) : QuestTypes.QuestProgress {
    let lst = switch (quests.get(owner)) {
      case (?l) { l };
      case null {
        let l = List.empty<QuestTypes.QuestProgress>();
        quests.add(owner, l);
        l;
      };
    };
    let completedAt : ?CommonTypes.Timestamp = switch (status) {
      case (#completed) { ?Time.now() };
      case (_) { null };
    };
    let progress : QuestTypes.QuestProgress = {
      questId;
      status;
      xpReward;
      completedAt;
    };
    let existing = lst.find(func(q) { q.questId == questId });
    switch (existing) {
      case (?_) {
        lst.mapInPlace(func(q) {
          if (q.questId == questId) { progress } else { q };
        });
      };
      case null {
        lst.add(progress);
      };
    };
    progress;
  };
};
