import CommonTypes "common";

module {
  public type CareerLevel = Nat; // 1-20

  public type UserProfile = {
    id : CommonTypes.UserId;
    careerLevel : CareerLevel;
    totalXp : Nat;
    levelTitle : Text;
    lastLocation : Text;
    lastUpdated : CommonTypes.Timestamp;
    createdAt : CommonTypes.Timestamp;
    inventory : ?[Text];
  };

  /// Shared type returned by getPlayerProfile — mirrors UserProfile exactly.
  public type PlayerProfile = UserProfile;
};
