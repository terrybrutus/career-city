import Map "mo:core/Map";
import List "mo:core/List";
import CommonTypes "../types/common";
import ItemTypes "../types/item";

module {
  public type ShopItem = ItemTypes.ShopItem;

  public let catalog : [ItemTypes.ShopItem] = [
    {
      id = "resume_boost";
      name = "Resume Boost Potion";
      description = "Enhances your resume tailoring results for one session.";
      xpCost = 50;
      effect = "resume_quality_boost";
    },
    {
      id = "confidence_elixir";
      name = "Confidence Elixir";
      description = "Unlocks a bonus interview question set from Chad.";
      xpCost = 75;
      effect = "interview_bonus_questions";
    },
    {
      id = "interview_armor";
      name = "Interview Armor";
      description = "Reduces the sting of tough interview feedback.";
      xpCost = 100;
      effect = "interview_armor";
    },
    {
      id = "cover_letter_scroll";
      name = "Cover Letter Scroll";
      description = "Pre-fills a cover letter template for Penny.";
      xpCost = 40;
      effect = "cover_letter_template";
    },
    {
      id = "networking_potion";
      name = "Networking Potion";
      description = "Unlocks a secret NPC quest around town.";
      xpCost = 150;
      effect = "unlock_npc_quest";
    },
  ];

  public func getItem(itemId : Text) : ?ItemTypes.ShopItem {
    var found : ?ItemTypes.ShopItem = null;
    var i = 0;
    while (i < catalog.size()) {
      if (catalog[i].id == itemId) { found := ?catalog[i] };
      i += 1;
    };
    found;
  };

  public func listItems() : [ItemTypes.ShopItem] { catalog };
};
