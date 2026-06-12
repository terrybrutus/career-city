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
const SharedArtifactPage = lazy(() => import("@/pages/SharedArtifactPage"));

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
const sharedResumeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/share/resume/$token",
  component: () => <SharedArtifactPage type="resume" />,
});
const sharedCoverLetterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/share/cover-letter/$token",
  component: () => <SharedArtifactPage type="cover-letter" />,
});
const router = createRouter({
  routeTree: rootRoute.addChildren([
    gameRoute,
    sharedResumeRoute,
    sharedCoverLetterRoute,
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
