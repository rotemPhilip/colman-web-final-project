interface DeleteConfirmProps {
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirm = ({ message = "Delete this?", onConfirm, onCancel }: DeleteConfirmProps) => (
  <div className="d-flex align-items-center gap-2">
    <span className="text-danger small fw-semibold">
      <i className="bi bi-exclamation-triangle me-1"></i>{message}
    </span>
    <button className="btn btn-danger btn-sm py-0 px-2" onClick={onConfirm}>
      Yes
    </button>
    <button className="btn btn-light btn-sm py-0 px-2" onClick={onCancel}>
      No
    </button>
  </div>
);

export default DeleteConfirm;
