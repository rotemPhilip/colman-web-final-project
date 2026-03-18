import { type FormEvent } from "react";

interface AISearchBarProps {
  searchQuery: string;
  onQueryChange: (query: string) => void;
  searching: boolean;
  hasResults: boolean;
  onSubmit: (e: FormEvent) => void;
  onClear: () => void;
}

const AISearchBar = ({
  searchQuery,
  onQueryChange,
  searching,
  hasResults,
  onSubmit,
  onClear,
}: AISearchBarProps) => (
  <form onSubmit={onSubmit} className="mb-4">
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
        placeholder='AI Search - try &quot;best pasta&quot; or &quot;something sweet&quot;...'
        value={searchQuery}
        onChange={(e) => onQueryChange(e.target.value)}
        style={{ boxShadow: "none" }}
      />
      {hasResults && (
        <button
          type="button"
          className="btn btn-link text-muted border-0 px-2"
          onClick={onClear}
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
);

export default AISearchBar;
