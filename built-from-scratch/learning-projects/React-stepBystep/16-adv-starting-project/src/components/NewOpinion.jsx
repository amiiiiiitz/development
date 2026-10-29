import { use } from "react";
import { useActionState } from "react";
import { OpinionsContext } from "../store/opinions-context";
import Submit from "./Submit.jsx";

export function NewOpinion() {
  const { addOpinion } = use(OpinionsContext);

  async function shareOpinionAction(prev, formdata) {
    let errors = [];

    const userName = formdata.get("userName");
    const title = formdata.get("title");
    const body = formdata.get("body");

    if (!userName.trim()) {
      errors.push("Please provide your name");
    }
    if (title.trim().length < 5) {
      errors.push("Title must be at least 5 characters long.");
    }
    if (body.trim().length < 10 || body.trim().length > 300) {
      errors.push("Opinion must be between 10 to 300 characters long.");
    }

    if (errors.length > 0) {
      return {
        errors,
        enteredValue: {
          userName,
          title,
          body,
        },
      };
    }

    await addOpinion({ userName, title, body });
    return { erros: null };
  }

  const [formState, formAction] = useActionState(shareOpinionAction, {
    errors: null,
  });
  return (
    <div id="new-opinion">
      <h2>Share your opinion!</h2>
      <form action={formAction}>
        <div className="control-row">
          <p className="control">
            <label htmlFor="userName">Your Name</label>
            <input
              type="text"
              id="userName"
              name="userName"
              defaultValue={formState.enteredValue?.userName}
            />
          </p>

          <p className="control">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              defaultValue={formState.enteredValue?.title}
            />
          </p>
        </div>
        <p className="control">
          <label htmlFor="body">Your Opinion</label>
          <textarea
            id="body"
            name="body"
            rows={5}
            defaultValue={formState.enteredValue?.body}
          ></textarea>
        </p>
        {formState.errors && (
          <ul className="errors">
            {formState.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}

        <Submit />
      </form>
    </div>
  );
}
