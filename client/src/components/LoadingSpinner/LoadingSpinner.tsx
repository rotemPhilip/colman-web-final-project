interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner = ({ message }: LoadingSpinnerProps) => (
  <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
    {message && <p className="text-muted small mt-2">{message}</p>}
  </div>
);

export default LoadingSpinner;
