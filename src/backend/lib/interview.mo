import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import InterviewTypes "../types/interview";
import CommonTypes "../types/common";

module {
  public type InterviewNote = InterviewTypes.InterviewNote;

  public func list(
    notes : Map.Map<CommonTypes.UserId, List.List<InterviewTypes.InterviewNote>>,
    owner : CommonTypes.UserId
  ) : [InterviewTypes.InterviewNote] {
    switch (notes.get(owner)) {
      case (?lst) { lst.toArray() };
      case null { [] };
    };
  };

  public func get(
    notes : Map.Map<CommonTypes.UserId, List.List<InterviewTypes.InterviewNote>>,
    owner : CommonTypes.UserId,
    id : Nat
  ) : ?InterviewTypes.InterviewNote {
    switch (notes.get(owner)) {
      case (?lst) { lst.find(func(n) { n.id == id }) };
      case null { null };
    };
  };

  public func create(
    notes : Map.Map<CommonTypes.UserId, List.List<InterviewTypes.InterviewNote>>,
    nextId : Nat,
    owner : CommonTypes.UserId,
    sessionDate : CommonTypes.Timestamp,
    role : Text,
    question : Text,
    answer : Text,
    score : ?Nat
  ) : (InterviewTypes.InterviewNote, Nat) {
    let now = Time.now();
    let note : InterviewTypes.InterviewNote = {
      id = nextId;
      owner;
      sessionDate;
      role;
      question;
      answer;
      score;
      createdAt = now;
    };
    let lst = switch (notes.get(owner)) {
      case (?l) { l };
      case null {
        let l = List.empty<InterviewTypes.InterviewNote>();
        notes.add(owner, l);
        l;
      };
    };
    lst.add(note);
    (note, nextId + 1);
  };

  public func update(
    notes : Map.Map<CommonTypes.UserId, List.List<InterviewTypes.InterviewNote>>,
    owner : CommonTypes.UserId,
    id : Nat,
    sessionDate : CommonTypes.Timestamp,
    role : Text,
    question : Text,
    answer : Text,
    score : ?Nat
  ) : ?InterviewTypes.InterviewNote {
    switch (notes.get(owner)) {
      case (?lst) {
        var result : ?InterviewTypes.InterviewNote = null;
        lst.mapInPlace(func(n) {
          if (n.id == id) {
            let updated : InterviewTypes.InterviewNote = {
              n with
              sessionDate;
              role;
              question;
              answer;
              score;
            };
            result := ?updated;
            updated;
          } else { n };
        });
        result;
      };
      case null { null };
    };
  };

  public func remove(
    notes : Map.Map<CommonTypes.UserId, List.List<InterviewTypes.InterviewNote>>,
    owner : CommonTypes.UserId,
    id : Nat
  ) : Bool {
    switch (notes.get(owner)) {
      case (?lst) {
        let before = lst.size();
        let filtered = lst.filter(func(n) { n.id != id });
        lst.clear();
        lst.append(filtered);
        lst.size() < before;
      };
      case null { false };
    };
  };
};
