import Map "mo:core/Map";
import List "mo:core/List";
import InterviewLib "../lib/interview";
import ProfileLib "../lib/profile";
import InterviewTypes "../types/interview";
import CommonTypes "../types/common";
import ProfileTypes "../types/profile";
import Runtime "mo:core/Runtime";

mixin (
  interviewNotes : Map.Map<CommonTypes.UserId, List.List<InterviewTypes.InterviewNote>>,
  profiles : Map.Map<CommonTypes.UserId, ProfileTypes.UserProfile>
) {
  var nextInterviewId : Nat = 0;
  public shared ({ caller }) func listInterviewNotes() : async [InterviewTypes.InterviewNote] {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous callers not allowed") };
    InterviewLib.list(interviewNotes, caller);
  };

  public shared ({ caller }) func getInterviewNote(id : Nat) : async ?InterviewTypes.InterviewNote {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous callers not allowed") };
    InterviewLib.get(interviewNotes, caller, id);
  };

  public shared ({ caller }) func createInterviewNote(
    sessionDate : CommonTypes.Timestamp,
    role : Text,
    question : Text,
    answer : Text,
    score : ?Nat
  ) : async InterviewTypes.InterviewNote {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous callers not allowed") };
    ignore ProfileLib.getOrCreate(profiles, caller);
    let (note, newId) = InterviewLib.create(
      interviewNotes, nextInterviewId, caller,
      sessionDate, role, question, answer, score
    );
    nextInterviewId := newId;
    note;
  };

  public shared ({ caller }) func updateInterviewNote(
    id : Nat,
    sessionDate : CommonTypes.Timestamp,
    role : Text,
    question : Text,
    answer : Text,
    score : ?Nat
  ) : async ?InterviewTypes.InterviewNote {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous callers not allowed") };
    InterviewLib.update(interviewNotes, caller, id, sessionDate, role, question, answer, score);
  };

  public shared ({ caller }) func deleteInterviewNote(id : Nat) : async Bool {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous callers not allowed") };
    InterviewLib.remove(interviewNotes, caller, id);
  };
};
