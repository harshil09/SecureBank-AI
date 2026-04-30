import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { User, Mail, Hash, ArrowLeft } from "lucide-react";

export default function UserDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuthStore();

  useEffect(() => {
    if (!token) {
      navigate("/", { replace: true });
    }
  }, [token, navigate]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <button style={styles.backButton} onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        <h1 style={styles.title}>User Details Page</h1>
        {location.state?.fromChatbot ? (
          <p style={styles.chatbotMessage}>
            {location.state?.message || "Taken to user detail page"}
          </p>
        ) : null}
        <p style={styles.subtitle}>
          Here are your profile details fetched after login.
        </p>

        <div style={styles.detailRow}>
          <div style={styles.iconWrap}>
            <User size={18} />
          </div>
          <div>
            <p style={styles.label}>Name</p>
            <p style={styles.value}>{user?.name || "User"}</p>
          </div>
        </div>

        <div style={styles.detailRow}>
          <div style={styles.iconWrap}>
            <Mail size={18} />
          </div>
          <div>
            <p style={styles.label}>Email</p>
            <p style={styles.value}>{user?.email || "Not available"}</p>
          </div>
        </div>

        <div style={styles.detailRow}>
          <div style={styles.iconWrap}>
            <Hash size={18} />
          </div>
          <div>
            <p style={styles.label}>User ID</p>
            <p style={styles.value}>{user?.user_id ?? "Not available"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
  },
  card: {
    width: "100%",
    maxWidth: "560px",
    background: "#fff",
    borderRadius: "16px",
    padding: "28px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
    border: "1px solid rgba(5, 150, 105, 0.15)",
  },
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    border: "none",
    borderRadius: "10px",
    padding: "8px 12px",
    background: "rgba(5, 150, 105, 0.08)",
    color: "#047857",
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: "18px",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    color: "#111827",
  },
  subtitle: {
    marginTop: "8px",
    marginBottom: "24px",
    color: "#6b7280",
  },
  chatbotMessage: {
    marginTop: "10px",
    marginBottom: "8px",
    display: "inline-block",
    padding: "8px 10px",
    borderRadius: "10px",
    background: "rgba(5, 150, 105, 0.1)",
    color: "#047857",
    fontWeight: 600,
    fontSize: "13px",
  },
  detailRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "14px",
    borderRadius: "12px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    marginBottom: "12px",
  },
  iconWrap: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(5, 150, 105, 0.1)",
    color: "#059669",
  },
  label: {
    margin: 0,
    fontSize: "12px",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  },
  value: {
    margin: "2px 0 0",
    fontSize: "16px",
    fontWeight: 600,
    color: "#111827",
  },
};
