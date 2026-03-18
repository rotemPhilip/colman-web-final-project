import { useNavigate } from "react-router-dom";
import { type AISearchSource } from "../../services/ai.service";

interface AISearchResultsProps {
  answer: string;
  sources: AISearchSource[];
  onClear: () => void;
}

const AISearchResults = ({ answer, sources, onClear }: AISearchResultsProps) => {
  const navigate = useNavigate();

  return (
    <div className="mb-4 animate-fade-in">
      <div
        className="alert alert-info border-0 d-flex align-items-start gap-2 py-2 px-3"
        style={{ background: "linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 100%)" }}
      >
        <i className="bi bi-stars text-primary mt-1"></i>
        <span className="small" style={{ whiteSpace: "pre-wrap" }}>
          {answer}
        </span>
      </div>
      {sources.length > 0 && (
        <div className="d-flex flex-column gap-2 mt-3">
          <p className="text-muted small fw-semibold mb-1">
            <i className="bi bi-journal-text me-1"></i>Sources
          </p>
          {sources.map((source) => (
            <div
              key={source.postId}
              className="card border-0 shadow-sm overflow-hidden feed-card cursor-pointer"
              onClick={() => navigate(`/post/${source.postId}`)}
            >
              <div className="card-body py-2 px-3">
                <h6 className="fw-bold mb-1">{source.dishName}</h6>
                <p className="text-primary small fw-semibold mb-0">
                  <i className="bi bi-geo-alt-fill me-1"></i>
                  {source.restaurant}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="text-center mt-3">
        <button className="btn btn-outline-secondary btn-sm" onClick={onClear}>
          <i className="bi bi-x-lg me-1"></i>Clear
        </button>
      </div>
    </div>
  );
};

export default AISearchResults;
