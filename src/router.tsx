import { QueryClient } from "@tanstack/react-query";
import { createHashHistory, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  // Inside the packaged desktop app the page is opened from disk (file://),
  // where the pathname is the file path. Hash history keeps "/" matching.
  const useHash = typeof window !== "undefined" && window.location.protocol === "file:";

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    ...(useHash ? { history: createHashHistory() } : {}),
  });

  return router;
};
