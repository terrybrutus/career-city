import CommonTypes "common";

module {
  public type Experience = {
    company : Text;
    title : Text;
    startDate : Text;
    endDate : Text;
    description : Text;
  };

  public type Resume = {
    id : Nat;
    owner : CommonTypes.UserId;
    name : Text;
    email : Text;
    phone : Text;
    summary : Text;
    experiences : [Experience];
    skills : [Text];
    shareToken : CommonTypes.ShareToken;
    createdAt : CommonTypes.Timestamp;
    updatedAt : CommonTypes.Timestamp;
  };
};
