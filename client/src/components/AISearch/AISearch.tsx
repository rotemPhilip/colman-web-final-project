import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { aiSearch, type AISearchResponse } from "../../services/ai.service";

const AISearch = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AISearchResponse | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults(null);
    try {
      const data = await aiSearch(searchQuery.trim());
      setSearchResults(data);
    } catch {
      // silently fail
    } finally {
      setSearching(false);
    }
  };

  const clear = () => {
    setSearchQuery("");
    setSearchResults(null);
  };

  return (
    <div className="mb-4">
      <form onSubmit={handleSubmit}>
        <div
          className="input-group shadow-sm rounded-pill overflow-hidden"
          style={{ border: "2px solid #e0e7ff" }}
        >
          <span className="input-group-text bg-white border-0 ps-3">
            <i className="bi bi-stars text-primary"></i>
          </span>
          <input
            type="text"
            className="form-control border-0 py-2"
            placeholder='AI Search - try "best pasta" or "something sweet"...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ boxShadow: "none" }}
          />
          {searchResults !== null && (
            <button
              type="button"
              className="btn btn-link text-muted border-0 px-2"
              onClick={clear}
              title="Clear search"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary border-0 px-3"
            disabled={searching || !searchQuery.trim()}
          >
            {searching ? (
              <span className="spinner-border spinner-border-sm"></span>
            ) : (
              <i className="bi bi-search"></i>
            )}
          </button>
        </div>
      </form>

      {searching && (
        <div className="mt-3 d-flex align-items-center gap-2 px-1">
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Searching...</span>
          </div>
          <span className="small text-muted">AI is thinking...</span>
        </div>
      )}

      {searchResults !== null && (
        <div className="mt-3 animate-fade-in">
          <div
            className="alert alert-info border-0 d-flex align-items-start gap-2 py-2 px-3"
            style={{ background: "linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 100%)" }}
          >
            <i className="bi bi-stars text-primary mt-1"></i>
            <span className="small" style={{ whiteSpace: "pre-wrap" }}>
              {searchResults.answer}
            </span>
          </div>

          {searchResults.sources.length > 0 && (
            <div className="d-flex flex-column gap-2 mt-3">
              <p className="text-muted small fw-semibold mb-1">
                <i className="bi bi-journal-text me-1"></i>Sources
              </p>
              {searchResults.sources.map((source) => (
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
            <button className="btn btn-outline-secondary btn-sm" onClick={clear}>
              <i className="bi bi-x-lg me-1"></i>Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISearch;
