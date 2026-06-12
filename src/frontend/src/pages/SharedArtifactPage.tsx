import { type CoverLetter, type Resume, createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";

export default function SharedArtifactPage({
  type,
}: { type: "resume" | "cover-letter" }) {
  const { token } = useParams({ strict: false }) as { token: string };
  const { actor } = useActor(createActor);
  const { data, isLoading } = useQuery<Resume | CoverLetter | null>({
    queryKey: ["shared-artifact", type, token],
    enabled: Boolean(actor && token),
    queryFn: async () => {
      if (!actor) return null;
      return type === "resume"
        ? actor.getResumeByToken(token)
        : actor.getCoverLetterByToken(token);
    },
  });

  return (
    <div className="shared-artifact-page">
      <article>
        <p className="eyebrow">CAREER CITY SHARED ARTIFACT</p>
        {isLoading ? (
          <p>Loading shared work...</p>
        ) : !data ? (
          <h1>This shared artifact is unavailable.</h1>
        ) : "summary" in data ? (
          <>
            <h1>{data.name}</h1>
            <p>{data.summary}</p>
            {data.skills.length > 0 && <p>Skills: {data.skills.join(", ")}</p>}
          </>
        ) : (
          <>
            <h1>{data.jobTitle}</h1>
            <h2>{data.company}</h2>
            <p className="shared-body">{data.body}</p>
          </>
        )}
      </article>
    </div>
  );
}
