import { createBrowserRouter, RouterProvider } from "react-router-dom";

// import BlogPage, { loader as postsLoader } from './pages/Blog';
import HomePage from "./pages/Home";
// import PostPage, { loader as postLoader } from "./pages/Post";
import RootLayout from "./pages/Root";
import { lazy, Suspense } from "react";

const BlogPage = lazy(() => import("./pages/Blog")); // here we are using React's lazy function to dynamically import the BlogPage component. This means that the BlogPage component will only be loaded when it is needed, which can help improve the performance of our application by reducing the initial load time. without it import line is just returning a promise but with lazy it will return a React component that can be rendered when needed.

const PostPage = lazy(() => import("./pages/Post"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "posts",
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<p>Loading...</p>}>
                <BlogPage />
              </Suspense>
            ),
            // suspense is used to wrap the BlogPage component to handle the loading state while the component is being dynamically imported. This allows us to show a fallback UI (like a loading spinner) while the BlogPage component is being loaded.

            loader: () =>
              import("./pages/Blog").then((module) => module.loader()),
            // we use this to avoid importing the whole BlogPage component and dynamically importing the blog page here. module.loader() is the loader function exported from the BlogPage component file and this module is returned by the import() function.
          },
          {
            path: ":id",
            element: (
              <Suspense fallback={<p>Loading...</p>}>
                <PostPage />
              </Suspense>
            ),
            loader: ({ params }) =>
              import("./pages/Post").then((module) => module.loader({ params })), // instead of params we can pass meta object as well.
          },
        ],
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
