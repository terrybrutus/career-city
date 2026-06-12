import Text "mo:core/Text";

mixin () {
  // Career City ships with dependable offline coaching. Provider-backed AI
  // must be added through a Caffeine-managed secret, never committed here.
  func missing(fieldName : Text, value : Text) : ?Text {
    if (value.size() == 0) {
      ?("Please add " # fieldName # " before continuing.")
    } else {
      null
    };
  };

  public func tailorResume(
    jobDescription : Text,
    resumeText : Text
  ) : async { #ok : Text; #err : Text } {
    switch (missing("the job description", jobDescription)) {
      case (?message) { return #err(message) };
      case null {};
    };
    switch (missing("your current resume or background", resumeText)) {
      case (?message) { return #err(message) };
      case null {};
    };

    #ok(
      "## Vera's Tailoring Plan\n\n" #
      "### 1. Lead with the target role\n" #
      "Rewrite your summary so the first two lines clearly name the role you want and the strongest evidence that you can do it.\n\n" #
      "### 2. Match the posting honestly\n" #
      "Identify 5-8 repeated skills or responsibilities in the job description. Use the exact wording only where it truthfully matches your experience.\n\n" #
      "### 3. Turn duties into achievements\n" #
      "For each recent role, use **action + scope + measurable result**. Replace phrases such as 'responsible for' with clear action verbs.\n\n" #
      "### 4. Make the top half earn the interview\n" #
      "Put your most relevant skills and strongest recent results before older or unrelated experience.\n\n" #
      "### 5. Final quality check\n" #
      "- Keep formatting simple and ATS-readable.\n" #
      "- Remove unsupported claims and filler.\n" #
      "- Proofread dates, tense, and contact information.\n\n" #
      "Your next move: revise the three bullets most closely related to this job, then return for another pass."
    );
  };

  public func generateCoverLetter(
    jobTitle : Text,
    company : Text,
    background : Text
  ) : async { #ok : Text; #err : Text } {
    switch (missing("the job title", jobTitle)) {
      case (?message) { return #err(message) };
      case null {};
    };
    switch (missing("the company name", company)) {
      case (?message) { return #err(message) };
      case null {};
    };
    switch (missing("your relevant background", background)) {
      case (?message) { return #err(message) };
      case null {};
    };

    #ok(
      "Dear Hiring Team at " # company # ",\n\n" #
      "I am excited to apply for the " # jobTitle # " role. My background has prepared me to contribute quickly, collaborate thoughtfully, and turn ambiguous goals into dependable results.\n\n" #
      "What draws me to this opportunity is the chance to connect my experience directly to the work your team is doing. I would bring a practical, curious approach: listening first, identifying the highest-impact problems, and following through with clear communication and measurable outcomes.\n\n" #
      "I would welcome the opportunity to discuss how my experience can support " # company # ". Thank you for your time and consideration.\n\n" #
      "Sincerely,\nYour Name\n\n" #
      "---\n**Penny's note:** Replace the middle paragraph with one specific achievement from your background and one specific reason you chose this company."
    );
  };

  public func interviewQuestion(
    jobTitle : Text,
    category : Text,
    previousQuestion : ?Text,
    userAnswer : ?Text
  ) : async { #ok : Text; #err : Text } {
    switch (missing("the role you are practicing for", jobTitle)) {
      case (?message) { return #err(message) };
      case null {};
    };

    switch (previousQuestion, userAnswer) {
      case (?_, ?answer) {
        switch (missing("your answer", answer)) {
          case (?message) { #err(message) };
          case null {
            #ok(
              "Feedback: You gave me a starting point. Strengthen it by naming the situation, the action you personally took, and the result. Add one concrete detail or number so your impact is easy to remember.\n\n" #
              "Next Question: Tell me about a time you received difficult feedback. What did you change afterward?"
            );
          };
        };
      };
      case _ {
        let focus = if (category.size() == 0) { "problem-solving" } else { category };
        #ok(
          "Tell me about a time you demonstrated " # focus #
          " while working toward an important goal. What was your specific contribution, and what was the result?"
        );
      };
    };
  };
};
