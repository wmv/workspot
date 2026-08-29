import { useEffect } from "react";
import { useVenues } from "../lib/venueStore";

export function Toast() {
  const { toast, setToast } = useVenues();

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast, setToast]);

  if (!toast) return null;
  return (
    <div className="toast" role="status">
      {toast}
    </div>
  );
}
