import Map "mo:core/Map";
import List "mo:core/List";
import CoverLetterLib "../lib/coverletter";
import ProfileLib "../lib/profile";
import CoverLetterTypes "../types/coverletter";
import CommonTypes "../types/common";
import ProfileTypes "../types/profile";
import Runtime "mo:core/Runtime";

mixin (
  coverLetters : Map.Map<CommonTypes.UserId, List.List<CoverLetterTypes.CoverLetter>>,
  coverLettersByToken : Map.Map<CommonTypes.ShareToken, CoverLetterTypes.CoverLetter>,
  profiles : Map.Map<CommonTypes.UserId, ProfileTypes.UserProfile>
) {
  var nextCoverLetterId : Nat = 0;
  public shared ({ caller }) func listCoverLetters() : async [CoverLetterTypes.CoverLetter] {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous callers not allowed") };
    CoverLetterLib.list(coverLetters, caller);
  };

  public shared ({ caller }) func getCoverLetter(id : Nat) : async ?CoverLetterTypes.CoverLetter {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous callers not allowed") };
    CoverLetterLib.get(coverLetters, caller, id);
  };

  public shared ({ caller }) func createCoverLetter(
    jobTitle : Text,
    company : Text,
    body : Text,
    tone : Text
  ) : async CoverLetterTypes.CoverLetter {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous callers not allowed") };
    ignore ProfileLib.getOrCreate(profiles, caller);
    let (cl, newId) = CoverLetterLib.create(
      coverLetters, coverLettersByToken, nextCoverLetterId,
      caller, jobTitle, company, body, tone
    );
    nextCoverLetterId := newId;
    ignore ProfileLib.addXp(profiles, caller, 75);
    cl;
  };

  public shared ({ caller }) func updateCoverLetter(
    id : Nat,
    jobTitle : Text,
    company : Text,
    body : Text,
    tone : Text
  ) : async ?CoverLetterTypes.CoverLetter {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous callers not allowed") };
    CoverLetterLib.update(coverLetters, coverLettersByToken, caller, id, jobTitle, company, body, tone);
  };

  public shared ({ caller }) func deleteCoverLetter(id : Nat) : async Bool {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous callers not allowed") };
    CoverLetterLib.remove(coverLetters, coverLettersByToken, caller, id);
  };

  public query func getCoverLetterByToken(token : CommonTypes.ShareToken) : async ?CoverLetterTypes.CoverLetter {
    CoverLetterLib.getByShareToken(coverLettersByToken, token);
  };
};
