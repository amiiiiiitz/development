import { Suspense } from "react";
import EventsList from "../components/EventsList";
import { Await, useLoaderData } from "react-router-dom";

function EventsPage() {
  // const data = useLoaderData();

  // if (data.isError) {
  //   return <p>{data.message}</p>;
  // }

  // const events = data.events; // we can also directly return the events from the loader function and use it here without using data.events. but here we are returning the whole response from the loader function and then extracting the events from it. this is because we might need some other data from the response in the future and we can easily extract it from the response without changing the loader function.

  const { events } = useLoaderData();
  return (
    // <>
    //   {/* <EventsList events={events} /> */}
    // </>
    <Suspense fallback={<p style={{ textAlign: "center" }}>Loading...</p>}>
      <Await resolve={events}>
        {(loadedEvents) => <EventsList events={loadedEvents} />}
        {/* react will call this functoin */}
      </Await>
    </Suspense>
  );
}

export default EventsPage;

async function loadEvents() {
  // by this loader function we can have the data before the page is loaded. this loader function excetues on browser not on the server. thats why we can use any browser api here in this loader function. like local storage, fetch api etc. and we can also use any npm package here in this loader function. like axios, moment etc. but we cant use any react hook here in this loader function because this loader function is not a react component. its just a regular javascript function. and we can also return any data from this loader function and it will be available in the component where we are using useLoaderData hook. and we can also return a response from this loader function and it will be available in the component where we are using useLoaderData hook. and we can also return a promise from this loader function and it will be resolved before the component is rendered. and we can also return a rejected promise from this loader function and it will be handled by the errorElement of the route. and we can also throw an error from this loader function and it will be handled by the errorElement of the route.
  const response = await fetch("http://localhost:8080/events");

  if (!response.ok) {
    // return { isError : true, message: "Could not fetch events." };
    throw new Response(JSON.stringify({ message: "Could not fetch events." }), {
      status: 500,
    });
  } else {
    const resData = await response.json();

    // // const res = new Response('any data', {status: 500,});

    return resData.events; // react will automatically return this and make available it wherever we want it. here we are returning events cause the backend is sending the data in this format. but we cant use these data on higher level.

    // return response; // we can also return the response directly and useLoaderData will automatically extract the data from it.
  }
}

export function loader() {
  return {
    events: loadEvents(),
  };
}
