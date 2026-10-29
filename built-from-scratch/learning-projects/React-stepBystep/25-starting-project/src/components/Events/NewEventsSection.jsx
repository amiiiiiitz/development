import { useQuery } from "@tanstack/react-query";

import LoadingIndicator from "../UI/LoadingIndicator.jsx";
import ErrorBlock from "../UI/ErrorBlock.jsx";
import EventItem from "./EventItem.jsx";
import { fetchEvents } from "../../util/http.js";

export default function NewEventsSection() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["events", { max: 2 }],

    queryFn: ({ signal, queryKey }) => fetchEvents({ signal, ...queryKey[1] }),

    staleTime: 5000, // this will prevent refetching the events for 5 seconds after the last fetch. we use this to prevent refetching the events immediately after adding a new event, since we are adding the new event to the cache manually after adding it to the server, so we don't need to refetch the events immediately after adding a new event. default is 0
    // gcTime: 1000 * 60 * 60, // this will keep the events in the cache for 1 hour after the last time they were used. default is 5 minutes (1000 * 60 * 5).means after 5 minutes currently having cached events, if they are not used (accessed) for 1 hour, they will be garbage collected (removed from the cache). this is useful to prevent memory leaks in case we have a lot of events in the cache that are not used anymore.
  });

  let content;

  if (isPending) {
    content = <LoadingIndicator />;
  }

  if (isError) {
    content = (
      <ErrorBlock title="An error occurred" message={ error.info?.message || "Failed to fetch events" } />
    );
  }

  if (data) {
    content = (
      <ul className="events-list">
        {data.map((event) => (
          <li key={event.id}>
            <EventItem event={event} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="content-section" id="new-events-section">
      <header>
        <h2>Recently added events</h2>
      </header>
      {content}
    </section>
  );
}
