import type { ReactNode } from "react";

interface AuthCardProps {
  subtitle: string;
  children: ReactNode;
}

const AuthCard = ({ subtitle, children }: AuthCardProps) => (
  <div
    className="min-vh-100 d-flex align-items-center justify-content-center px-3"
    style={{
      background: "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 30%, #f7c59f 60%, #ffe8d6 100%)",
    }}
  >
    <div
      className="card shadow-lg border-0 p-4 animate-fade-in"
      style={{ maxWidth: 440, width: "100%", borderRadius: 24 }}
    >
      <div className="card-body text-center">
        <div className="mb-3">
          <img
            src="/favicon.svg"
            alt="BiteShare"
            width="56"
            height="56"
            style={{ filter: "drop-shadow(0 4px 12px rgba(255,107,53,0.3))" }}
          />
        </div>
        <h1 className="h3 fw-bold mb-1 text-primary">BiteShare</h1>
        <p className="text-muted small mb-4">{subtitle}</p>
        {children}
      </div>
    </div>
  </div>
);

export default AuthCard;
