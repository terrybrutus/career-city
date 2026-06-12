import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import CoverLetterTypes "../types/coverletter";
import CommonTypes "../types/common";

module {
  public type CoverLetter = CoverLetterTypes.CoverLetter;

  func generateToken(owner : CommonTypes.UserId, id : Nat, now : Int) : Text {
    owner.toText() # "-cl-" # id.toText() # "-" # now.toText();
  };

  public func list(
    coverLetters : Map.Map<CommonTypes.UserId, List.List<CoverLetterTypes.CoverLetter>>,
    owner : CommonTypes.UserId
  ) : [CoverLetterTypes.CoverLetter] {
    switch (coverLetters.get(owner)) {
      case (?lst) { lst.toArray() };
      case null { [] };
    };
  };

  public func get(
    coverLetters : Map.Map<CommonTypes.UserId, List.List<CoverLetterTypes.CoverLetter>>,
    owner : CommonTypes.UserId,
    id : Nat
  ) : ?CoverLetterTypes.CoverLetter {
    switch (coverLetters.get(owner)) {
      case (?lst) { lst.find(func(c) { c.id == id }) };
      case null { null };
    };
  };

  public func create(
    coverLetters : Map.Map<CommonTypes.UserId, List.List<CoverLetterTypes.CoverLetter>>,
    coverLettersByToken : Map.Map<CommonTypes.ShareToken, CoverLetterTypes.CoverLetter>,
    nextId : Nat,
    owner : CommonTypes.UserId,
    jobTitle : Text,
    company : Text,
    body : Text,
    tone : Text
  ) : (CoverLetterTypes.CoverLetter, Nat) {
    let now = Time.now();
    let id = nextId;
    let token = generateToken(owner, id, now);
    let cl : CoverLetterTypes.CoverLetter = {
      id;
      owner;
      jobTitle;
      company;
      body;
      tone;
      shareToken = token;
      createdAt = now;
      updatedAt = now;
    };
    let lst = switch (coverLetters.get(owner)) {
      case (?l) { l };
      case null {
        let l = List.empty<CoverLetterTypes.CoverLetter>();
        coverLetters.add(owner, l);
        l;
      };
    };
    lst.add(cl);
    coverLettersByToken.add(token, cl);
    (cl, id + 1);
  };

  public func update(
    coverLetters : Map.Map<CommonTypes.UserId, List.List<CoverLetterTypes.CoverLetter>>,
    coverLettersByToken : Map.Map<CommonTypes.ShareToken, CoverLetterTypes.CoverLetter>,
    owner : CommonTypes.UserId,
    id : Nat,
    jobTitle : Text,
    company : Text,
    body : Text,
    tone : Text
  ) : ?CoverLetterTypes.CoverLetter {
    switch (coverLetters.get(owner)) {
      case (?lst) {
        var result : ?CoverLetterTypes.CoverLetter = null;
        lst.mapInPlace(func(c) {
          if (c.id == id) {
            let updated : CoverLetterTypes.CoverLetter = {
              c with
              jobTitle;
              company;
              body;
              tone;
              updatedAt = Time.now();
            };
            coverLettersByToken.add(c.shareToken, updated);
            result := ?updated;
            updated;
          } else { c };
        });
        result;
      };
      case null { null };
    };
  };

  public func remove(
    coverLetters : Map.Map<CommonTypes.UserId, List.List<CoverLetterTypes.CoverLetter>>,
    coverLettersByToken : Map.Map<CommonTypes.ShareToken, CoverLetterTypes.CoverLetter>,
    owner : CommonTypes.UserId,
    id : Nat
  ) : Bool {
    switch (coverLetters.get(owner)) {
      case (?lst) {
        let before = lst.size();
        let token = switch (lst.find(func(c) { c.id == id })) {
          case (?c) { ?c.shareToken };
          case null { null };
        };
        let filtered = lst.filter(func(c) { c.id != id });
        lst.clear();
        lst.append(filtered);
        switch (token) {
          case (?t) { coverLettersByToken.remove(t) };
          case null {};
        };
        lst.size() < before;
      };
      case null { false };
    };
  };

  public func getByShareToken(
    coverLettersByToken : Map.Map<CommonTypes.ShareToken, CoverLetterTypes.CoverLetter>,
    token : CommonTypes.ShareToken
  ) : ?CoverLetterTypes.CoverLetter {
    coverLettersByToken.get(token);
  };
};
