import { createPortal } from "react-dom";

export default function Portal({ children }) {
  const portalRoot = document.getElementById("portal-root");
  if (!portalRoot) return null;

  return createPortal(children, portalRoot);
}
