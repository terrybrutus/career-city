import Map "mo:core/Map";
import ProfileLib "../lib/profile";
import ProfileTypes "../types/profile";
import CommonTypes "../types/common";
import Runtime "mo:core/Runtime";

mixin (
  profiles : Map.Map<CommonTypes.UserId, ProfileTypes.UserProfile>
) {
  public shared ({ caller }) func getMyProfile() : async ProfileTypes.UserProfile {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous callers not allowed") };
    ProfileLib.getOrCreate(profiles, caller);
  };

  public shared ({ caller }) func savePlayerPosition(location : Text) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous callers not allowed") };
    ProfileLib.saveLocation(profiles, caller, location);
  };

  /// Returns the caller's player profile (xp, level, inventory, etc.).
  public shared ({ caller }) func getPlayerProfile() : async ProfileTypes.UserProfile {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous callers not allowed") };
    ProfileLib.getOrCreate(profiles, caller);
  };

  /// Retained for interface compatibility. Rewards are awarded only by
  /// server-owned artifact and mission completion rules.
  public shared ({ caller }) func updateXP(amount : Nat) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous callers not allowed") };
    ignore amount;
    ignore ProfileLib.getOrCreate(profiles, caller);
  };

  public shared ({ caller }) func recordNpcInteraction(npcId : Text) : async ProfileTypes.UserProfile {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous callers not allowed") };
    ignore npcId; // npcId reserved for future NPC-specific XP bonuses
    ignore ProfileLib.getOrCreate(profiles, caller);
    ProfileLib.getOrCreate(profiles, caller);
  };
};
