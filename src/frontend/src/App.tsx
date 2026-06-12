import GameLayout from "@/components/GameLayout";
import { ToastContainer } from "@/components/ui/Toast";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useState } from "react";

const GamePage = lazy(() => import("@/pages/GamePage"));
const ResumePage = lazy(() => import("@/pages/ResumePage"));
const CoverLetterPage = lazy(() => import("@/pages/CoverLetterPage"));
const InterviewPage = lazy(() => import("@/pages/InterviewPage"));

/** Full-screen overlay to prompt landscape rotation on mobile portrait */
function RotatePrompt() {
  return (
    <div
      data-ocid="rotate_prompt.panel"
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        fontFamily: '"Space Grotesk", monospace',
      }}
    >
      <div
        style={{
          fontSize: "3rem",
          animation: "spin-cw 2s linear infinite",
          marginBottom: "1.5rem",
        }}
      >
        ↻
      </div>
      <div
        style={{
          color: "#39FF14",
          fontSize: "1.25rem",
          fontWeight: 700,
          textShadow: "0 0 12px #39FF14",
          letterSpacing: "0.08em",
          textAlign: "center",
          padding: "0 2rem",
        }}
      >
        ROTATE YOUR DEVICE
      </div>
      <div
        style={{
          color: "#39FF1488",
          fontSize: "1.125rem",
          marginTop: "0.75rem",
          textAlign: "center",
          padding: "0 2rem",
        }}
      >
        Career City is best played in landscape mode
      </div>
    </div>
  );
}

function OrientationGuard({ children }: { children: React.ReactNode }) {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const check = () => {
      // Only enforce on touch devices (mobile/tablet)
      const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      if (isMobile) {
        setIsPortrait(window.innerHeight > window.innerWidth);
      }
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  if (isPortrait) return <RotatePrompt />;
  return <>{children}</>;
}

const rootRoute = createRootRoute({
  component: () => (
    <OrientationGuard>
      <Suspense
        fallback={
          <div
            style={{
              width: "100vw",
              height: "100vh",
              background: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: '"Space Grotesk", monospace',
                color: "#39ff14",
                fontSize: "1.25rem",
                fontWeight: 700,
                textShadow: "0 0 8px #39ff14",
              }}
            >
              LOADING CAREER CITY...
            </span>
          </div>
        }
      >
        <GameLayout>
          <Outlet />
        </GameLayout>
      </Suspense>
      <ToastContainer />
    </OrientationGuard>
  ),
});

const gameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: GamePage,
});

const resumeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/resume",
  component: ResumePage,
});

const coverLetterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/coverletter",
  component: CoverLetterPage,
});

const interviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/interview",
  component: InterviewPage,
});

const routeTree = rootRoute.addChildren([
  gameRoute,
  resumeRoute,
  coverLetterRoute,
  interviewRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
