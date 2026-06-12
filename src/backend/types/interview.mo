import CommonTypes "common";

module {
  public type InterviewNote = {
    id : Nat;
    owner : CommonTypes.UserId;
    sessionDate : CommonTypes.Timestamp;
    role : Text;
    question : Text;
    answer : Text;
    score : ?Nat;
    createdAt : CommonTypes.Timestamp;
  };
};
