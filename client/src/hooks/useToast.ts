export interface Toast {
  message: string;
  type: "success" | "error";
}

type Listener = (toast: Toast | null) => void;

let _listener: Listener | null = null;

export const _register = (fn: Listener) => { _listener = fn; };

export const showToast = (message: string, type: "success" | "error" = "success") => {
  _listener?.({ message, type });
  setTimeout(() => _listener?.(null), 3000);
};
