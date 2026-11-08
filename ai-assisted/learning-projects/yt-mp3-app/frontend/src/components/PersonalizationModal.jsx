import { useEffect, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";

const MAX_NAME_LENGTH = 32;

function normalizeName(value) {
  return Array.from(value.trim().replace(/\s+/gu, " "))
    .slice(0, MAX_NAME_LENGTH)
    .join("");
}

export default function PersonalizationModal({
  initialName,
  isFirstVisit,
  error,
  onSave,
  onClear,
  onDismiss,
  onSkip,
}) {
  const [draft, setDraft] = useState(initialName);
  const [isClosing, setIsClosing] = useState(false);
  const inputRef = useRef(null);
  const modalRef = useRef(null);
  const onDismissRef = useRef(onDismiss);
  const onSkipRef = useRef(onSkip);
  const isClosingRef = useRef(false);
  const normalizedDraft = normalizeName(draft);
  const displayName = normalizedDraft || "Your soundtrack";
  onDismissRef.current = onDismiss;
  onSkipRef.current = onSkip;

  const dismissRef = useRef(() => {});
  dismissRef.current = () => {
    if (isClosingRef.current) {
      return;
    }
    isClosingRef.current = true;
    setIsClosing(true);
    window.setTimeout(() => {
      if (isFirstVisit) {
        onSkipRef.current();
      } else {
        onDismissRef.current();
      }
    }, 180);
  };

  useEffect(() => {
    const previousFocus = document.activeElement;
    inputRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dismissRef.current();
      } else if (event.key === "Tab") {
        const focusable = modalRef.current?.querySelectorAll(
          'button:not(:disabled), input:not(:disabled)'
        );
        if (!focusable?.length) {
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
    };
  }, []);

  const closeWith = (callback) => {
    if (isClosingRef.current) {
      return;
    }
    isClosingRef.current = true;
    setIsClosing(true);
    window.setTimeout(callback, 180);
  };

  const dismiss = () => closeWith(onDismiss);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!normalizedDraft || !onSave(normalizedDraft)) {
      return;
    }
    closeWith(() => onDismissRef.current());
  };

  const handleClear = () => {
    if (onClear()) {
      closeWith(() => onDismissRef.current());
    }
  };

  const handleChange = (event) => {
    const nextValue = Array.from(event.target.value)
      .slice(0, MAX_NAME_LENGTH)
      .join("");
    setDraft(nextValue);
  };

  return (
    <div className={`personalization-overlay ${isClosing ? "is-leaving" : ""}`}>
      <section
        ref={modalRef}
        className={`personalization-modal ${isClosing ? "is-leaving" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="personalization-title"
        aria-describedby="personalization-description"
      >
        {!isFirstVisit && (
          <button
            type="button"
            className="personalization-close"
            onClick={dismiss}
            aria-label="Close personalization"
          >
            <X size={17} />
          </button>
        )}
        <span className="personalization-kicker"><span /> MAKE IT UNIQUELY YOURS</span>
        <h2 id="personalization-title">
          Every music space deserves
          <br />
          <em>a personal touch.</em>
        </h2>
        <p id="personalization-description" className="personalization-description">
          What name would you like to sign your listening space with?
        </p>

        <div className="signature-preview" aria-live="polite">
          <span className="signature-preview-label">YOUR SIGNATURE</span>
          <span className="signature-preview-name">{displayName}</span>
          <span className="signature-preview-rule" />
        </div>

        <form className="personalization-form" onSubmit={handleSubmit}>
          <label htmlFor="personalization-name">Your name</label>
          <div className="personalization-input-wrap">
            <input
              ref={inputRef}
              id="personalization-name"
              type="text"
              value={draft}
              onChange={handleChange}
              placeholder="The name you go by"
              autoComplete="nickname"
              aria-describedby="personalization-name-hint"
            />
            <span className="personalization-count" aria-hidden="true">
              {Array.from(draft).length}/{MAX_NAME_LENGTH}
            </span>
          </div>
          <span id="personalization-name-hint" className="personalization-hint">
            Up to {MAX_NAME_LENGTH} characters. Saved only in this browser.
          </span>
          <button className="personalization-continue" type="submit" disabled={!normalizedDraft}>
            {isFirstVisit ? "Continue" : "Save signature"} <ArrowRight size={16} />
          </button>
        </form>

        {error && <p className="personalization-error" role="alert">{error}</p>}
        <div className="personalization-footer-actions">
          {!isFirstVisit && initialName && (
            <button type="button" className="personalization-clear" onClick={handleClear}>
              Use default signature
            </button>
          )}
          <button type="button" className="personalization-dismiss" onClick={() => dismissRef.current()}>
            {isFirstVisit ? "Skip for now" : "Cancel"}
          </button>
        </div>
      </section>
    </div>
  );
}
