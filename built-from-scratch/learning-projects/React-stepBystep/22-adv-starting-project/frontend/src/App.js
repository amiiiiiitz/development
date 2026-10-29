import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./pages/Root";
import ErrorPage from "./pages/ErrorPage";
import HomePage from "./pages/HomePage";
import EventsPage, { loader as eventsLoader } from "./pages/EventsPage";
import EventDetailPage, {
  loader as eventDetailLoader,
  action as deleteEventAction,
} from "./pages/EventDetailPage";
import NewEventPage from "./pages/NewEventPage";
import EditEventPage from "./pages/EditEventPage";
import EventsRoot from "./pages/EventsRoot";
import { action as manupilateEventAction } from "./components/EventForm";
import NewsletterPage, { action as newsletterAction } from "./pages/Newsletter";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: "events",
        element: <EventsRoot />,
        errorElement: <ErrorPage />,
        children: [
          {
            index: true,
            element: <EventsPage />,
            loader: eventsLoader,
          },
          {
            path: ":eventId",
            id: "event-detail",
            loader: eventDetailLoader,
            // React Router loader summary:
            //
            // 1) useLoaderData()
            // - Reads loader data from the SAME route where this component is rendered.
            // - It only works if that exact route has a loader in App.js.
            //
            // 2) useRouteLoaderData("route-id")
            // - Reads loader data from a specific MATCHED ancestor route by its id.
            // - Can read parent, grandparent, or root loader data (not only direct parent).
            // - Cannot read unrelated/sibling route loader data.
            //
            // 3) Important rule
            // - Exporting `loader` from a page file is not enough by itself.
            // - The loader must be attached to a route in createBrowserRouter config.
            //
            // 4) In this project
            // - EventsPage uses useLoaderData() because its own route has loader: eventsLoader.
            // - eventDetailLoader is attached to route path ":eventId" with id: "event-detail".
            // - EventDetailPage and EditEventPage are child routes under ":eventId".
            // - So those child pages should use useRouteLoaderData("event-detail").
            //
            // 5) If you want EventDetailPage to use useLoaderData()
            // - Attach the loader directly to EventDetailPage's own route in App.js.

            children: [
              {
                index: true,
                element: <EventDetailPage />,
                action: deleteEventAction,
              },
              {
                path: "edit",
                element: <EditEventPage />,
                action: manupilateEventAction,
              },
            ],
          },
          {
            path: "new",
            element: <NewEventPage />,
            action: manupilateEventAction,
          },
        ],
      },
      {
        path: "newsletter",
        element: <NewsletterPage />,
        action: newsletterAction,
      },
    ],
  },
]);
function App() {
  return <RouterProvider router={router} />;
}

export default App;
