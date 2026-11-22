import { useEffect, useState } from "react";

const PERSONALIZATION_NAME_KEY = "nofi-personalization-name";
const PERSONALIZATION_STATUS_KEY = "nofi-personalization-status";
const LEGACY_SIGNATURE_KEY = "nofi-library-signature";
const MAX_PERSONALIZATION_NAME_LENGTH = 32;

function normalizePersonalizationName(value) {
  if (typeof value !== "string") return "";
  return Array.from(value.trim().replace(/\s+/gu, " "))
    .slice(0, MAX_PERSONALIZATION_NAME_LENGTH)
    .join("");
}

export function usePersonalization({ setError, setNotice }) {
  const [signatureName, setSignatureName] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const status = window.localStorage.getItem(PERSONALIZATION_STATUS_KEY);
      const currentName = window.localStorage.getItem(PERSONALIZATION_NAME_KEY);
      const legacyName = currentName === null ? window.localStorage.getItem(LEGACY_SIGNATURE_KEY) : null;
      const savedName = normalizePersonalizationName(currentName ?? legacyName);
      const hasSavedChoice = status === "personalized" || status === "skipped";

      setSignatureName(status === "skipped" ? "" : savedName);
      if (hasSavedChoice) {
        if (status === "personalized" && currentName !== savedName) {
          window.localStorage.setItem(PERSONALIZATION_NAME_KEY, savedName);
        }
        setHasCompleted(true);
      } else if (savedName) {
        window.localStorage.setItem(PERSONALIZATION_NAME_KEY, savedName);
        window.localStorage.setItem(PERSONALIZATION_STATUS_KEY, "personalized");
        setHasCompleted(true);
      } else {
        setIsOpen(true);
      }
    } catch (storageError) {
      setError(storageError.message || "Could not read your saved personalization from this browser.");
      setIsOpen(true);
    } finally {
      setIsReady(true);
    }
  }, [setError]);

  const save = (value) => {
    const name = normalizePersonalizationName(value);
    if (!name) {
      setError("Enter a name for your signature.");
      return false;
    }
    try {
      window.localStorage.setItem(PERSONALIZATION_NAME_KEY, name);
      window.localStorage.setItem(PERSONALIZATION_STATUS_KEY, "personalized");
      setSignatureName(name);
      setHasCompleted(true);
      setError("");
      setNotice("Your signature has been saved.");
      return true;
    } catch (storageError) {
      setError(storageError.message || "Could not save your signature in this browser.");
      return false;
    }
  };

  const clear = () => {
    try {
      window.localStorage.removeItem(PERSONALIZATION_NAME_KEY);
      window.localStorage.removeItem(LEGACY_SIGNATURE_KEY);
      window.localStorage.setItem(PERSONALIZATION_STATUS_KEY, "skipped");
      setSignatureName("");
      setHasCompleted(true);
      setError("");
      setNotice("Your default signature has been restored.");
      return true;
    } catch (storageError) {
      setError(storageError.message || "Could not clear your saved signature.");
      return false;
    }
  };

  const skip = () => {
    try {
      window.localStorage.setItem(PERSONALIZATION_STATUS_KEY, "skipped");
      window.localStorage.removeItem(PERSONALIZATION_NAME_KEY);
      window.localStorage.removeItem(LEGACY_SIGNATURE_KEY);
      setSignatureName("");
      setHasCompleted(true);
      setError("");
      setIsOpen(false);
    } catch (storageError) {
      setError(storageError.message || "Could not save your personalization preference.");
    }
  };

  const open = () => {
    setError("");
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

  return {
    signatureName,
    isPersonalizationReady: isReady,
    hasCompletedPersonalization: hasCompleted,
    showPersonalization: isOpen,
    savePersonalization: save,
    clearPersonalization: clear,
    skipPersonalization: skip,
    openPersonalization: open,
    closePersonalization: close,
  };
}


