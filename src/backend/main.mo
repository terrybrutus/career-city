import Map "mo:core/Map";
import List "mo:core/List";
import CommonTypes "types/common";
import ProfileTypes "types/profile";
import ResumeTypes "types/resume";
import CoverLetterTypes "types/coverletter";
import InterviewTypes "types/interview";
import QuestTypes "types/quest";
import ProfileApi "mixins/profile-api";
import ResumeApi "mixins/resume-api";
import CoverLetterApi "mixins/coverletter-api";
import InterviewApi "mixins/interview-api";
import QuestApi "mixins/quest-api";
import AiApi "mixins/ai-api";
import ItemApi "mixins/item-api";







persistent actor {
  let profiles : Map.Map<CommonTypes.UserId, ProfileTypes.UserProfile> = Map.empty();
  let resumes : Map.Map<CommonTypes.UserId, List.List<ResumeTypes.Resume>> = Map.empty();
  let resumesByToken : Map.Map<CommonTypes.ShareToken, ResumeTypes.Resume> = Map.empty();
  let coverLetters : Map.Map<CommonTypes.UserId, List.List<CoverLetterTypes.CoverLetter>> = Map.empty();
  let coverLettersByToken : Map.Map<CommonTypes.ShareToken, CoverLetterTypes.CoverLetter> = Map.empty();
  let interviewNotes : Map.Map<CommonTypes.UserId, List.List<InterviewTypes.InterviewNote>> = Map.empty();
  let quests : Map.Map<CommonTypes.UserId, List.List<QuestTypes.QuestProgress>> = Map.empty();

  include ProfileApi(profiles);
  include ResumeApi(resumes, resumesByToken, profiles);
  include CoverLetterApi(coverLetters, coverLettersByToken, profiles);
  include InterviewApi(interviewNotes, profiles);
  include QuestApi(quests, profiles);
  include ItemApi(profiles);
  include AiApi();
};
