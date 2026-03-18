import type { FormEvent } from "react";
import Avatar from "../../components/Avatar/Avatar";

interface NewCommentFormProps {
  username?: string;
  profileImage?: string;
  value: string;
  submitting: boolean;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
}

const NewCommentForm = ({
  username,
  profileImage,
  value,
  submitting,
  onChange,
  onSubmit,
}: NewCommentFormProps) => {
  return (
    <form onSubmit={onSubmit} className="mb-4">
      <div className="d-flex gap-2">
        <Avatar username={username} profileImage={profileImage} className="flex-shrink-0 mt-1" />
        <div className="flex-grow-1">
          <div className="input-group">
            <input
              type="text"
              placeholder="Write a comment..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="form-control"
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !value.trim()}
            >
              {submitting ? (
                <span className="spinner-border spinner-border-sm"></span>
              ) : (
                <i className="bi bi-send"></i>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default NewCommentForm;
