import { useState, useRef, type FormEvent } from "react";
import ImagePicker from "../ImagePicker/ImagePicker";

interface PostFormProps {
  initialDishName?: string;
  initialRestaurant?: string;
  initialDescription?: string;
  initialImagePreview?: string;
  submitLabel?: string;
  submittingLabel?: string;
  onSubmit: (data: {
    dishName: string;
    restaurant: string;
    description: string;
    image: File | null;
  }) => Promise<void>;
  onCancel: () => void;
}

const PostForm = ({
  initialDishName = "",
  initialRestaurant = "",
  initialDescription = "",
  initialImagePreview = "",
  submitLabel = "Post",
  submittingLabel = "Posting...",
  onSubmit,
  onCancel,
}: PostFormProps) => {
  const [post, setPost] = useState({
    dishName: initialDishName,
    restaurant: initialRestaurant,
    description: initialDescription,
    image: null as File | null,
    imagePreview: initialImagePreview,
  });
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const setField = <K extends keyof typeof post>(key: K, value: (typeof post)[K]) =>
    setPost((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!post.dishName.trim() || !post.restaurant.trim()) return;
    setSubmitting(true);
    try {
      const { imagePreview: _, ...submitData } = post;
      await onSubmit(submitData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} ref={formRef}>
      <div className="row g-2 mb-2">
        <div className="col-sm-6">
          <div className="input-group">
            <span className="input-group-text bg-light border-end-0">
              <i className="bi bi-fork-knife"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Dish name"
              value={post.dishName}
              onChange={(e) => setField("dishName", e.target.value)}
            />
          </div>
        </div>
        <div className="col-sm-6">
          <div className="input-group">
            <span className="input-group-text bg-light border-end-0">
              <i className="bi bi-geo-alt"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Restaurant name"
              value={post.restaurant}
              onChange={(e) => setField("restaurant", e.target.value)}
            />
          </div>
        </div>
      </div>

      <textarea
        className="form-control mb-3"
        placeholder="Tell us about your experience..."
        value={post.description}
        onChange={(e) => setField("description", e.target.value)}
        rows={3}
      />

      <div className="d-flex align-items-center justify-content-between">
        <ImagePicker
          preview={post.imagePreview}
          onPick={(file, url) => setPost((prev) => ({ ...prev, image: file, imagePreview: url }))}
          onClear={() => setPost((prev) => ({ ...prev, image: null, imagePreview: "" }))}
        />
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-light btn-sm" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-sm px-3"
            disabled={submitting || !post.dishName.trim() || !post.restaurant.trim()}
          >
            {submitting ? (
              <><span className="spinner-border spinner-border-sm me-1"></span>{submittingLabel}</>
            ) : (
              <><i className="bi bi-send me-1"></i>{submitLabel}</>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PostForm;
