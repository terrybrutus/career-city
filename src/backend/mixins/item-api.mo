import Map "mo:core/Map";
import ItemLib "../lib/item";
import ProfileLib "../lib/profile";
import ItemTypes "../types/item";
import ProfileTypes "../types/profile";
import CommonTypes "../types/common";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";

mixin (
  profiles : Map.Map<CommonTypes.UserId, ProfileTypes.UserProfile>
) {
  /// List all items available in the shop.
  public query func listShopItems() : async [ItemTypes.ShopItem] {
    ItemLib.listItems();
  };

  /// Purchase an item with Career Tokens. Tokens are derived from lifetime XP
  /// minus the cost of owned items, so purchases never lower level progress.
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
        } else {
          let inventory = switch (profile.inventory) { case null { [] }; case (?owned) { owned } };
          var spent : Nat = 0;
          var i = 0;
          while (i < inventory.size()) {
            switch (ItemLib.getItem(inventory[i])) {
              case (?ownedItem) { spent += ownedItem.xpCost };
              case null {};
            };
            i += 1;
          };
          let available = if (profile.totalXp > spent) { Nat.sub(profile.totalXp, spent) } else { 0 };
          if (available < item.xpCost) {
            #err("Insufficient Career Tokens. Need " # item.xpCost.toText() # ", have " # available.toText())
          } else {
            ignore ProfileLib.addItem(profiles, caller, itemId);
            #ok(true)
          }
        };
      };
    };
  };
};
