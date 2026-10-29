import { Link, useNavigate } from "react-router-dom";

import Modal from "../UI/Modal.jsx";
import EventForm from "./EventForm.jsx";
import { useMutation } from "@tanstack/react-query";
import { createNewEvent } from "../../util/http.js";
import ErrorBlock from "../UI/ErrorBlock.jsx";
import { queryClient } from "../../util/http.js";

export default function NewEvent() {
  const navigate = useNavigate();

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: createNewEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"], exact: false }); // here without the exact: true, it will invalidate all queries that start with "events", which is not what we want, we only want to invalidate the query that fetches the list of events, which is the one with the query key ["events"], so we need to add exact: true to make sure that only that query is invalidated.
      navigate("/events");
    },
  });

  function handleSubmit(formData) {
    mutate({ event: formData });
    //navigate("../"); we will not do this as it will not check whether the event was created successfully or not, so it will navigate back even if there was an error, which is not what we want. We want to stay on the page and show the error message if there was an error, and only navigate back if the event was created successfully.
  }

  return (
    <Modal onClose={() => navigate("../")}>
      <EventForm onSubmit={handleSubmit}>
        {isPending && <p>Creating event...</p>}
        {!isPending && (
          <>
            <Link to="../" className="button-text">
              Cancel
            </Link>
            <button type="submit" className="button">
              Create
            </button>
          </>
        )}
      </EventForm>
      {isError && <ErrorBlock title="Failed to create event" message={error.info?.message || "An unknown error occurred."} />}
    </Modal>
  );
}
