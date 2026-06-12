import CommonTypes "common";

module {
  public type QuestStatus = { #notStarted; #inProgress; #completed };

  public type QuestProgress = {
    questId : Text;
    status : QuestStatus;
    xpReward : Nat;
    completedAt : ?CommonTypes.Timestamp;
  };
};
