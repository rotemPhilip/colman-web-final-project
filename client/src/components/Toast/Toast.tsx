import { useState, useEffect } from "react";

type ToastType = { message: string; type: "success" | "error" };
type Listener = (t: ToastType | null) => void;

let _listener: Listener | null = null;

export const showToast = (message: string, type: "success" | "error" = "success") => {
  _listener?.({ message, type });
  setTimeout(() => _listener?.(null), 3000);
};

const Toast = () => {
  const [toast, setToast] = useState<ToastType | null>(null);

  useEffect(() => {
    _listener = setToast;
    return () => { _listener = null; };
  }, []);

  if (!toast) return null;
  return (
    <div className={`toast-notification toast-${toast.type}`}>
      <i className={`bi ${toast.type === "success" ? "bi-check-circle" : "bi-exclamation-circle"} me-2`}></i>
      {toast.message}
    </div>
  );
};

export default Toast;
