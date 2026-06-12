import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import ResumeTypes "../types/resume";
import CommonTypes "../types/common";

module {
  public type Resume = ResumeTypes.Resume;

  func generateToken(owner : CommonTypes.UserId, id : Nat, now : Int) : Text {
    owner.toText() # "-" # id.toText() # "-" # now.toText();
  };

  public func list(
    resumes : Map.Map<CommonTypes.UserId, List.List<ResumeTypes.Resume>>,
    owner : CommonTypes.UserId
  ) : [ResumeTypes.Resume] {
    switch (resumes.get(owner)) {
      case (?lst) { lst.toArray() };
      case null { [] };
    };
  };

  public func get(
    resumes : Map.Map<CommonTypes.UserId, List.List<ResumeTypes.Resume>>,
    owner : CommonTypes.UserId,
    id : Nat
  ) : ?ResumeTypes.Resume {
    switch (resumes.get(owner)) {
      case (?lst) { lst.find(func(r) { r.id == id }) };
      case null { null };
    };
  };

  public func create(
    resumes : Map.Map<CommonTypes.UserId, List.List<ResumeTypes.Resume>>,
    resumesByToken : Map.Map<CommonTypes.ShareToken, ResumeTypes.Resume>,
    nextId : Nat,
    owner : CommonTypes.UserId,
    name : Text,
    email : Text,
    phone : Text,
    summary : Text,
    experiences : [ResumeTypes.Experience],
    skills : [Text]
  ) : (ResumeTypes.Resume, Nat) {
    let now = Time.now();
    let id = nextId;
    let token = generateToken(owner, id, now);
    let resume : ResumeTypes.Resume = {
      id;
      owner;
      name;
      email;
      phone;
      summary;
      experiences;
      skills;
      shareToken = token;
      createdAt = now;
      updatedAt = now;
    };
    let lst = switch (resumes.get(owner)) {
      case (?l) { l };
      case null {
        let l = List.empty<ResumeTypes.Resume>();
        resumes.add(owner, l);
        l;
      };
    };
    lst.add(resume);
    resumesByToken.add(token, resume);
    (resume, id + 1);
  };

  public func update(
    resumes : Map.Map<CommonTypes.UserId, List.List<ResumeTypes.Resume>>,
    resumesByToken : Map.Map<CommonTypes.ShareToken, ResumeTypes.Resume>,
    owner : CommonTypes.UserId,
    id : Nat,
    name : Text,
    email : Text,
    phone : Text,
    summary : Text,
    experiences : [ResumeTypes.Experience],
    skills : [Text]
  ) : ?ResumeTypes.Resume {
    switch (resumes.get(owner)) {
      case (?lst) {
        var result : ?ResumeTypes.Resume = null;
        lst.mapInPlace(func(r) {
          if (r.id == id) {
            let updated : ResumeTypes.Resume = {
              r with
              name;
              email;
              phone;
              summary;
              experiences;
              skills;
              updatedAt = Time.now();
            };
            resumesByToken.add(r.shareToken, updated);
            result := ?updated;
            updated;
          } else { r };
        });
        result;
      };
      case null { null };
    };
  };

  public func remove(
    resumes : Map.Map<CommonTypes.UserId, List.List<ResumeTypes.Resume>>,
    resumesByToken : Map.Map<CommonTypes.ShareToken, ResumeTypes.Resume>,
    owner : CommonTypes.UserId,
    id : Nat
  ) : Bool {
    switch (resumes.get(owner)) {
      case (?lst) {
        let before = lst.size();
        let token = switch (lst.find(func(r) { r.id == id })) {
          case (?r) { ?r.shareToken };
          case null { null };
        };
        let filtered = lst.filter(func(r) { r.id != id });
        lst.clear();
        lst.append(filtered);
        switch (token) {
          case (?t) { resumesByToken.remove(t) };
          case null {};
        };
        lst.size() < before;
      };
      case null { false };
    };
  };

  public func getByShareToken(
    resumesByToken : Map.Map<CommonTypes.ShareToken, ResumeTypes.Resume>,
    token : CommonTypes.ShareToken
  ) : ?ResumeTypes.Resume {
    resumesByToken.get(token);
  };
};
