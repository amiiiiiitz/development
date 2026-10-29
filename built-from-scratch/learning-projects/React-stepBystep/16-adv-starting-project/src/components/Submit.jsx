import { useFormStatus } from "react-dom";

/**
 * Submit button component that disables itself while the form is submitting.
 * ⚠️ Note: This component must be rendered as a child of a <form> element.
 *    Using it outside a form will prevent it from tracking submission status correctly.
 * ⚡ Tip: `useFormStatus()` can provide more parameters in addition to `pending`.
 *    For example, you could access `method`, `action`, or other form state if needed.
 */


export default function Submit() {
  const { pending } = useFormStatus();
  return (
    <p className="actions">
      <button type="submit" disabled={pending}>
        {pending ? 'submitting...' : 'Submit'}
      </button>
    </p>
  );
}
