import { Await, Link, redirect, useRouteLoaderData } from "react-router-dom";
import EventItem from "../components/EventItem";
import EventsList from "../components/EventsList";
import { Suspense } from "react";

function EventDetailPage() {
  // const data = useRouteLoaderData("event-detail");

  const { event, events } = useRouteLoaderData("event-detail");
  return (
    <>
      <Suspense fallback={<p style={{ textAlign: "center" }}>Loading...</p>}> 
        <Await resolve={event}>
          {(loadedEvent) => <EventItem event={loadedEvent} />}
        </Await>
      </Suspense>

      <Suspense fallback={<p style={{ textAlign: "center" }}>Loading...</p>}>
        <Await resolve={events}>
          {(loadedEvents) => <EventsList events={loadedEvents} />}
        </Await>
      </Suspense>

      {/* <EventItem event={data.event} /> */}
      <p>
        <Link to=".." relative="path">
          Back to All Events
        </Link>
      </p>
    </>
  );
}
export default EventDetailPage;

async function loadEvent(eventId) {
  const response = await fetch("http://localhost:8080/events/" + eventId);

  if (!response.ok) {
    throw new Response(
      JSON.stringify({ message: "Could not fetch event details." }),
      { status: 500 },
    );
  } else {
    const resData = await response.json();
    return resData.event;
  }
}

async function loadEvents() {
  // see the comments for this on eventspage
  const response = await fetch("http://localhost:8080/events");

  if (!response.ok) {
    throw new Response(JSON.stringify({ message: "Could not fetch events." }), {
      status: 500,
    });
  } else {
    const resData = await response.json();
    return resData.events;
  }
}

export async function loader({ request, params }) {
  // we are recieving request and params from the router. request is the request object that we are sending to the server and params is the params object that contains all route parameters.
  const eventId = params.eventId;
  // const response = await fetch("http://localhost:8080/events/" + eventId);

  // if (!response.ok) {
  //   throw new Response(
  //     JSON.stringify({ message: "Could not fetch event details." }),
  //     { status: 500 },
  //   );
  // } else {
  //   return response;
  // }

  return {
    event: await loadEvent(eventId),
    events: loadEvents(),
  };
}

export async function action({ params, request }) {
  const eventId = params.eventId;

  const response = await fetch("http://localhost:8080/events/" + eventId, {
    method: request.method,
  });

  if (!response.ok) {
    throw new Response(JSON.stringify({ message: "Could not delete event." }), {
      status: 500,
    });
  }
  return redirect("/events");
}
