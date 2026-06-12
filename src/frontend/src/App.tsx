import GameLayout from "@/components/GameLayout";
import { ToastContainer } from "@/components/ui/Toast";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Suspense, lazy } from "react";

const GamePage = lazy(() => import("@/pages/GamePage"));
const ResumePage = lazy(() => import("@/pages/ResumePage"));
const CoverLetterPage = lazy(() => import("@/pages/CoverLetterPage"));
const InterviewPage = lazy(() => import("@/pages/InterviewPage"));

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Suspense
        fallback={
          <div className="app-loading">
            <span>LOADING CAREER CITY...</span>
          </div>
        }
      >
        <GameLayout>
          <Outlet />
        </GameLayout>
      </Suspense>
      <ToastContainer />
    </>
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

const router = createRouter({
  routeTree: rootRoute.addChildren([
    gameRoute,
    resumeRoute,
    coverLetterRoute,
    interviewRoute,
  ]),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
