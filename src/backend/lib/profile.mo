import Map "mo:core/Map";
import Time "mo:core/Time";
import ProfileTypes "../types/profile";
import CommonTypes "../types/common";
import Runtime "mo:core/Runtime";

module {
  public type UserProfile = ProfileTypes.UserProfile;

  public func computeLevel(totalXp : Nat) : Nat {
    let thresholds : [Nat] = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500, 6600, 7800, 9100, 10500, 12000, 13600, 15300, 17100, 19000];
    var level = 1;
    var i = 0;
    while (i < thresholds.size()) {
      if (totalXp >= thresholds[i]) {
        level := i + 1;
      };
      i += 1;
    };
    level;
  };

  public func levelTitle(level : Nat) : Text {
    if (level >= 20) { "CTO" }
    else if (level >= 18) { "VP of Eng" }
    else if (level >= 15) { "Principal" }
    else if (level >= 12) { "Staff Eng" }
    else if (level >= 8) { "Senior Dev" }
    else if (level >= 5) { "Dev" }
    else if (level >= 2) { "Junior Dev" }
    else { "Intern" };
  };

  public func getOrCreate(
    profiles : Map.Map<CommonTypes.UserId, ProfileTypes.UserProfile>,
    caller : CommonTypes.UserId
  ) : ProfileTypes.UserProfile {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous callers not allowed") };
    switch (profiles.get(caller)) {
      case (?p) { p };
      case null {
        let now = Time.now();
        let profile : ProfileTypes.UserProfile = {
          id = caller;
          careerLevel = 1;
          totalXp = 0;
          levelTitle = "Intern";
          lastLocation = "town_square";
          lastUpdated = now;
          createdAt = now;
          inventory = null;
        };
        profiles.add(caller, profile);
        profile;
      };
    };
  };

  public func getProfile(
    profiles : Map.Map<CommonTypes.UserId, ProfileTypes.UserProfile>,
    userId : CommonTypes.UserId
  ) : ?ProfileTypes.UserProfile {
    profiles.get(userId);
  };

  public func saveLocation(
    profiles : Map.Map<CommonTypes.UserId, ProfileTypes.UserProfile>,
    userId : CommonTypes.UserId,
    location : Text
  ) : () {
    let existing = switch (profiles.get(userId)) {
      case (?p) { p };
      case null { return };
    };
    let updated : ProfileTypes.UserProfile = {
      existing with
      lastLocation = location;
      lastUpdated = Time.now();
    };
    profiles.add(userId, updated);
  };

  public func addXp(
    profiles : Map.Map<CommonTypes.UserId, ProfileTypes.UserProfile>,
    userId : CommonTypes.UserId,
    xp : Nat
  ) : ProfileTypes.UserProfile {
    let existing = switch (profiles.get(userId)) {
      case (?p) { p };
      case null {
        let now = Time.now();
        let p : ProfileTypes.UserProfile = {
          id = userId;
          careerLevel = 1;
          totalXp = 0;
          levelTitle = "Intern";
          lastLocation = "town_square";
          lastUpdated = now;
          createdAt = now;
          inventory = null;
        };
        p;
      };
    };
    let newXp = existing.totalXp + xp;
    let newLevel = computeLevel(newXp);
    let updated : ProfileTypes.UserProfile = {
      existing with
      totalXp = newXp;
      careerLevel = newLevel;
      levelTitle = levelTitle(newLevel);
      lastUpdated = Time.now();
    };
    profiles.add(userId, updated);
    updated;
  };

  public func addItem(
    profiles : Map.Map<CommonTypes.UserId, ProfileTypes.UserProfile>,
    userId : CommonTypes.UserId,
    itemId : Text
  ) : ProfileTypes.UserProfile {
    let existing = getOrCreate(profiles, userId);
    let currentInventory : [Text] = switch (existing.inventory) {
      case (?inv) { inv };
      case null { [] };
    };
    let newInventory : [Text] = Array.tabulate<Text>(
      currentInventory.size() + 1,
      func(i) { if (i < currentInventory.size()) { currentInventory[i] } else { itemId } }
    );
    let updated : ProfileTypes.UserProfile = {
      existing with
      inventory = ?newInventory;
      lastUpdated = Time.now();
    };
    profiles.add(userId, updated);
    updated;
  };
};
