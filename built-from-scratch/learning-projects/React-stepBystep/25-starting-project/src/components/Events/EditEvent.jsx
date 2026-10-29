import {
  Link,
  redirect,
  useNavigate,
  useNavigation,
  useParams,
  useSubmit,
} from "react-router-dom";

import Modal from "../UI/Modal.jsx";
import EventForm from "./EventForm.jsx";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchEvent, updateEvent, queryClient } from "../../util/http.js";
import ErrorBlock from "../UI/ErrorBlock.jsx";

export default function EditEvent() {
  const navigate = useNavigate();
  const { state } = useNavigation();
  const submit = useSubmit();
  const params = useParams();

  const { data, isError, error } = useQuery({
    queryKey: ["events", params.id],
    queryFn: ({ signal }) => fetchEvent({ signal, id: params.id }),

    staleTime: 10000 // while using loader the fetching of data is already handled so we dont need usequery to fecthing those data behind the scene as it will be redundant.
  });

  // const { mutate } = useMutation({
  //   mutationFn: updateEvent,
  //   onMutate: async (data) => {
  //     // this onmutate will be called before the mutation function is executed, so we can optimistically update the cache here. we are not doing the update in the onSuccess because we want to optimistically update the cache, and if the mutation fails, we will roll back to the previous state in the onError.
  //     const newEvent = data.event;

  //     await queryClient.cancelQueries({ queryKey: ["events", params.id] }); // cancel query only cancel usequery, not mutation.

  //     const previousEvent = queryClient.getQueryData(["events", params.id]);
  //     queryClient.setQueryData(["events", params.id], newEvent);

  //     return { previousEvent }; // this return value will be available in the onError callback as the context parameter, so we can use it to roll back to the previous state if the mutation fails. we can also write it like that { previousEvent: previousEvent } but since the key and value are the same, we can just write it like that { previousEvent }.
  //   },

  //   onError: (error, variables, context) => {
  //     queryClient.setQueryData(["events", params.id], context.previousEvent); // roll back to the previous state if the mutation fails. we are using the context parameter to get the previous state that we returned in the onMutate callback.
  //   },

  //   onSettled: () => {
  //     queryClient.invalidateQueries({ queryKey: ["events", params.id] }); // invalidate the query to refetch the data from the server, this will ensure that we have the latest data in the cache, and it will also update the UI with the latest data.
  //   },
  // });

  function handleSubmit(formData) {
    // mutate({ id: params.id, event: formData });
    // navigate("../");
    submit(formData, { method: "PUT" }); // it will not send any request, but trigger the action function of the route, and the action function will handle the request and send the request to the server, and then we can handle the response in the action function and return the response to the component, and then we can use the response to update the UI. this is a better way to handle form submission in react router, because it will keep the logic of handling form submission in one place (the action function), and it will also make it easier to handle different types of requests (POST, PUT, DELETE) without having to write different functions for each type of request.
  }

  function handleClose() {
    navigate("../");
  }
  let content;

  if (isError) {
    content = (
      <>
        <ErrorBlock
          title="Failed to load event data"
          message={error.info?.message || "An unknown error occurred."}
        />
        <div className="form-actions">
          <Link to="../" className="button">
            Back to event details
          </Link>
        </div>
      </>
    );
  }
  if (data) {
    content = (
      <EventForm inputData={data} onSubmit={handleSubmit}>
        {state === "submitting" ? (
          <p>Updating event...</p>
        ) : (
          <>
            <Link to="../" className="button-text">
              Cancel
            </Link>
            <button type="submit" className="button">
              Update
            </button>
          </>
        )}
      </EventForm>
    );
  }
  return <Modal onClose={handleClose}>{content}</Modal>;
}

export function loader({ params }) {
  return queryClient.fetchQuery({
    queryKey: ["events", params.id],
    queryFn: ({ signal }) => fetchEvent({ signal, id: params.id }),
  });
}

export async function action({ request, params }) {
  const formData = await request.formData();
  const updatedEventData = Object.fromEntries(formData);
  await updateEvent({ id: params.id, event: updatedEventData });
  await queryClient.invalidateQueries(["events"]);

  return redirect("../");
}
