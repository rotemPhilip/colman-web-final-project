import type { Toast as ToastType } from "../../hooks/useToast";

interface ToastProps {
  toast: ToastType | null;
}

const Toast = ({ toast }: ToastProps) => {
  if (!toast) return null;
  return (
    <div className={`toast-notification toast-${toast.type}`}>
      <i className={`bi ${toast.type === "success" ? "bi-check-circle" : "bi-exclamation-circle"} me-2`}></i>
      {toast.message}
    </div>
  );
};

export default Toast;
