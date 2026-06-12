import Map "mo:core/Map";
import List "mo:core/List";
import ResumeLib "../lib/resume";
import ProfileLib "../lib/profile";
import ResumeTypes "../types/resume";
import CommonTypes "../types/common";
import ProfileTypes "../types/profile";
import Runtime "mo:core/Runtime";

mixin (
  resumes : Map.Map<CommonTypes.UserId, List.List<ResumeTypes.Resume>>,
  resumesByToken : Map.Map<CommonTypes.ShareToken, ResumeTypes.Resume>,
  profiles : Map.Map<CommonTypes.UserId, ProfileTypes.UserProfile>
) {
  var nextResumeId : Nat = 0;
  public shared ({ caller }) func listResumes() : async [ResumeTypes.Resume] {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous callers not allowed") };
    ResumeLib.list(resumes, caller);
  };

  public shared ({ caller }) func getResume(id : Nat) : async ?ResumeTypes.Resume {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous callers not allowed") };
    ResumeLib.get(resumes, caller, id);
  };

  public shared ({ caller }) func createResume(
    name : Text,
    email : Text,
    phone : Text,
    summary : Text,
    experiences : [ResumeTypes.Experience],
    skills : [Text]
  ) : async ResumeTypes.Resume {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous callers not allowed") };
    ignore ProfileLib.getOrCreate(profiles, caller);
    let (resume, newId) = ResumeLib.create(
      resumes, resumesByToken, nextResumeId,
      caller, name, email, phone, summary, experiences, skills
    );
    nextResumeId := newId;
    resume;
  };

  public shared ({ caller }) func updateResume(
    id : Nat,
    name : Text,
    email : Text,
    phone : Text,
    summary : Text,
    experiences : [ResumeTypes.Experience],
    skills : [Text]
  ) : async ?ResumeTypes.Resume {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous callers not allowed") };
    let result = ResumeLib.update(
      resumes, resumesByToken, caller, id,
      name, email, phone, summary, experiences, skills
    );
    switch (result) {
      case (?_) { ignore ProfileLib.getOrCreate(profiles, caller) };
      case null {};
    };
    result;
  };

  public shared ({ caller }) func deleteResume(id : Nat) : async Bool {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous callers not allowed") };
    ResumeLib.remove(resumes, resumesByToken, caller, id);
  };

  public query func getResumeByToken(token : CommonTypes.ShareToken) : async ?ResumeTypes.Resume {
    ResumeLib.getByShareToken(resumesByToken, token);
  };
};
