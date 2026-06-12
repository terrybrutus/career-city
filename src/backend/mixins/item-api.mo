import Map "mo:core/Map";
import ItemLib "../lib/item";
import ProfileLib "../lib/profile";
import ItemTypes "../types/item";
import ProfileTypes "../types/profile";
import CommonTypes "../types/common";
import Runtime "mo:core/Runtime";

mixin (
  profiles : Map.Map<CommonTypes.UserId, ProfileTypes.UserProfile>
) {
  /// List all items available in the shop.
  public query func listShopItems() : async [ItemTypes.ShopItem] {
    ItemLib.listItems();
  };

  /// Purchase an item by id, deducting XP from the caller's profile.
  /// Returns #ok(true) on success, #err(message) if insufficient XP or item not found.
  public shared ({ caller }) func purchaseItem(itemId : Text) : async { #ok : Bool; #err : Text } {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous callers not allowed") };
    switch (ItemLib.getItem(itemId)) {
      case null { #err("Item not found: " # itemId) };
      case (?item) {
        let profile = ProfileLib.getOrCreate(profiles, caller);
        let alreadyOwned = switch (profile.inventory) {
          case null { false };
          case (?inventory) {
            var found = false;
            var i = 0;
            while (i < inventory.size()) {
              if (inventory[i] == itemId) { found := true };
              i += 1;
            };
            found;
          };
        };
        if (alreadyOwned) {
          #err("You already own this item.")
        } else if (profile.totalXp < item.xpCost) {
          #err("Insufficient XP. Need " # item.xpCost.toText() # ", have " # profile.totalXp.toText())
        } else {
          ignore ProfileLib.deductXpAndAddItem(profiles, caller, item.xpCost, itemId);
          #ok(true)
        };
      };
    };
  };
};
