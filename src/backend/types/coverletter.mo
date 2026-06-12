import CommonTypes "common";

module {
  public type CoverLetter = {
    id : Nat;
    owner : CommonTypes.UserId;
    jobTitle : Text;
    company : Text;
    body : Text;
    tone : Text;
    shareToken : CommonTypes.ShareToken;
    createdAt : CommonTypes.Timestamp;
    updatedAt : CommonTypes.Timestamp;
  };
};
