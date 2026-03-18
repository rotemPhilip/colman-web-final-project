import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import AppNavbar from "../../components/AppNavbar/AppNavbar";
import { useAuth } from "../../context/useAuth";
import Avatar from "../../components/Avatar/Avatar";
import Toast from "../../components/Toast/Toast";
import PostForm from "../../components/PostForm/PostForm";
import { useFeed } from "../../features/feed/useFeed";
import PostCard from "../../features/feed/PostCard";
import { aiSearch, type AISearchResponse } from "../../services/ai.service";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AISearchResponse | null>(null);
  const [searchSummary, setSearchSummary] = useState("");

  const handleAISearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults(null);
    setSearchSummary("");
    try {
      const data = await aiSearch(searchQuery.trim());
      setSearchResults(data);
      setSearchSummary(data.answer);
    } catch {
      // silently fail
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
    setSearchSummary("");
  };

  const {
    posts,
    page,
    totalPages,
    loadingFeed,
    initialLoad,
    filter,
    showCreate,
    error,
    toast,
    sentinelRef,
    setFilter,
    setShowCreate,
    setError,
    handleCreate,
    handleEditSave,
    handleDelete,
    handleToggleLike,
  } = useFeed();

  return (
    <div className="min-vh-100 bg-light">
      <Toast toast={toast} />
      <AppNavbar filter={filter} onFilterChange={setFilter} />

      <main className="container" style={{ maxWidth: 640 }}>
        <div className="py-4">
          {/* AI Search Bar */}
          <form onSubmit={handleAISearch} className="mb-4">
            <div className="input-group shadow-sm rounded-pill overflow-hidden" style={{ border: "2px solid #e0e7ff" }}>
              <span className="input-group-text bg-white border-0 ps-3">
                <i className="bi bi-stars text-primary"></i>
              </span>
              <input
                type="text"
                className="form-control border-0 py-2"
                placeholder='AI Search — try "best pasta" or "something sweet"...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ boxShadow: "none" }}
              />
              {searchResults !== null && (
                <button type="button" className="btn btn-link text-muted border-0 px-2" onClick={clearSearch} title="Clear search">
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
              <button type="submit" className="btn btn-primary border-0 px-3" disabled={searching || !searchQuery.trim()}>
                {searching ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-search"></i>}
              </button>
            </div>
          </form>

          {/* AI Search Results */}
          {searchResults !== null && (
            <div className="mb-4 animate-fade-in">
              {searchSummary && (
                <div className="alert alert-info border-0 d-flex align-items-start gap-2 py-2 px-3" style={{ background: "linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 100%)" }}>
                  <i className="bi bi-stars text-primary mt-1"></i>
                  <span className="small">{searchSummary}</span>
                </div>
              )}
              {searchResults.sources.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-search text-muted" style={{ fontSize: "2rem" }}></i>
                  <p className="text-muted small mt-2 mb-0">No matching posts found. Try a different query.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {searchResults.sources.map((source) => (
                    <div key={source.postId} className="card border-0 shadow-sm overflow-hidden feed-card cursor-pointer" onClick={() => navigate(`/post/${source.postId}`)}>
                      <div className="card-body py-2 px-3">
                        <h6 className="fw-bold mb-1">{source.dishName}</h6>
                        <p className="text-primary small fw-semibold mb-0"><i className="bi bi-geo-alt-fill me-1"></i>{source.restaurant}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-center mt-3">
                <button className="btn btn-outline-primary btn-sm" onClick={clearSearch}>
                  <i className="bi bi-arrow-left me-1"></i>Back to Feed
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger py-2 small d-flex align-items-center gap-2 animate-fade-in">
              <i className="bi bi-exclamation-triangle"></i>
              {error}
              <button className="btn-close btn-close-sm ms-auto" onClick={() => setError("")}></button>
            </div>
          )}

          {searchResults === null && showCreate && (
            <div className="card border-0 shadow-sm mb-4 animate-slide-down">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <Avatar username={user?.username} profileImage={user?.profileImage} />
                  <h6 className="mb-0 fw-bold">Share a dining experience</h6>
                </div>
                <PostForm
                  submitLabel="Post"
                  submittingLabel="Posting..."
                  onSubmit={handleCreate}
                  onCancel={() => setShowCreate(false)}
                />
              </div>
            </div>
          )}

          {searchResults === null && (initialLoad ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted small mt-2">Loading feed...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="card border-0 shadow-sm text-center empty-state animate-fade-in">
              <div className="empty-state-icon">
                {filter === "mine" ? <i className="bi bi-journal-text"></i> : <i className="bi bi-fork-knife"></i>}
              </div>
              <h5 className="fw-bold mb-2">{filter === "mine" ? "No posts yet" : "Feed is empty"}</h5>
              <p className="text-muted mb-3">
                {filter === "mine"
                  ? "Share your first dining experience!"
                  : "Be the first to share a delicious experience!"}
              </p>
              {!showCreate && (
                <div>
                  <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                    <i className="bi bi-plus-lg me-1"></i>Create Post
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {posts.map((post, index) => (
                <PostCard
                  key={post._id}
                  post={post}
                  isOwn={user?._id === post.owner._id}
                  onSave={(data) => handleEditSave(post._id, data)}
                  onDelete={() => handleDelete(post._id)}
                  onToggleLike={() => handleToggleLike(post._id)}
                  animationDelay={`${index * 0.05}s`}
                />
              ))}

              <div ref={sentinelRef} className="text-center py-3">
                {loadingFeed && (
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                )}
                {!loadingFeed && page >= totalPages && posts.length > 0 && (
                  <small className="text-muted">You've seen all posts!</small>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {!showCreate && (
        <button className="biteshare-fab" onClick={() => setShowCreate(true)} title="New Post">
          <i className="bi bi-plus-lg"></i>
        </button>
      )}
    </div>
  );
};

export default Home;
