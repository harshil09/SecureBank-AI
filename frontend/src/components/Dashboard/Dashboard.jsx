import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { api } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  LogOut,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  DollarSign,
  Activity,
  Sparkles,
} from "lucide-react";

export default function Dashboard() {
  const { token, logout, user } = useAuthStore();
  const navigate = useNavigate();

  const [balance, setBalance] = useState(0);
  const [displayBalance, setDisplayBalance] = useState(0);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [transactions, setTransactions] = useState([]);
  
  // ✅ NEW: Track which transactions to highlight (indices)
  const [highlightedIndices, setHighlightedIndices] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [botStatusMessage, setBotStatusMessage] = useState("");
  const depositInputRef = useRef(null);
  const withdrawInputRef = useRef(null);
  const depositBtnRef = useRef(null);
  const withdrawBtnRef = useRef(null);
  const botActionInProgressRef = useRef(false);
  const botActionQueueRef = useRef([]);
  const skipNextApiActionRef = useRef(null);
  const botStatusTimeoutRef = useRef(null);
  const transactionsSectionRef = useRef(null);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const setBotStatus = (message, clearAfterMs = 0) => {
    setBotStatusMessage(message);
    if (botStatusTimeoutRef.current) {
      clearTimeout(botStatusTimeoutRef.current);
      botStatusTimeoutRef.current = null;
    }

    if (clearAfterMs > 0) {
      botStatusTimeoutRef.current = setTimeout(() => {
        setBotStatusMessage("");
        botStatusTimeoutRef.current = null;
      }, clearAfterMs);
    }
  };

  useEffect(() => {
    return () => {
      if (botStatusTimeoutRef.current) {
        clearTimeout(botStatusTimeoutRef.current);
      }
    };
  }, []);

  // Animated counter effect for balance
  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = balance / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= balance) {
        setDisplayBalance(balance);
        clearInterval(timer);
      } else {
        setDisplayBalance(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [balance]);

  useEffect(() => {
    const loadUser = async () => {
      if (token && !user) {
        try {
          const u = await api.getMe(token);
          useAuthStore.setState({ user: u });
        } catch (err) {
          console.error("User fetch failed", err);
        }
      }
    };
  
    loadUser();
  }, [token]);

  useEffect(() => {
    if (!token && process.env.NODE_ENV !== "development") {
        navigate("/", { replace: true });
    } else {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const bal = await api.getBalance(token);
      setBalance(bal.balance);

      const tx = await api.getTransactions(token);
      setTransactions(tx.reverse());
    } catch (err) {
      console.error(err);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onBankDataUpdated = () => {
      if (token) {
        fetchData();
      }
    };

    window.addEventListener("bank-data-updated", onBankDataUpdated);
    return () => {
      window.removeEventListener("bank-data-updated", onBankDataUpdated);
    };
  }, [token]);

  // ✅ FIXED: Handle transaction highlighting dynamically
  useEffect(() => {
    const onBankShowTransactions = async (event) => {
      if (!token) return;

      const requestedCount = event?.detail?.count;
      
      // ✅ Refresh data first
      await fetchData();
      
      // ✅ Handle "all" - show all, highlight none (or all)
      if (requestedCount === "all") {
        setHighlightedIndices([]); // Clear highlights (show all normally)
        setBotStatus("Showing all transactions", 2000);

        setTimeout(() => {
          transactionsSectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 120);
        return;
      }

      // ✅ Handle numeric counts - highlight the first N transactions
      const numericCount = Number(requestedCount);
      if (!Number.isFinite(numericCount) || numericCount <= 0) return;

      // Create array of indices to highlight [0, 1, 2, ... n-1]
      const indicesToHighlight = Array.from({ length: numericCount }, (_, i) => i);
      setHighlightedIndices(indicesToHighlight);
      
      setBotStatus(
        numericCount === 1 
          ? "Highlighting last transaction" 
          : `Highlighting last ${numericCount} transactions`,
        3000
      );

      setTimeout(() => {
        transactionsSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 120);
    };

    window.addEventListener("bank-chat-show-transactions", onBankShowTransactions);
    return () => {
      window.removeEventListener("bank-chat-show-transactions", onBankShowTransactions);
    };
  }, [token]);

  useEffect(() => {
    const onBankChatTransaction = (event) => {
      if (!token || actionLoading) return;

      const { type, amount } = event.detail || {};
      const normalizedAmount = Number(amount);
      if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) return;

      botActionQueueRef.current.push({ type, amount: normalizedAmount });

      const runSingleBotAction = async (command) => {
        const amountText = String(command.amount);
        if (command.type === "deposit") {
          setBotStatus(`Chatbot is typing ${amountText}`);
          depositInputRef.current?.focus();
          setDepositAmount("");
          await sleep(140);

          let typed = "";
          for (const char of amountText) {
            typed += char;
            setDepositAmount(typed);
            await sleep(140);
          }

          await sleep(300);
          skipNextApiActionRef.current = "deposit";
          setBotStatus("Chatbot clicked Add Money", 1200);
          depositBtnRef.current?.click();
        } else if (command.type === "withdraw") {
          setBotStatus(`Chatbot is typing ${amountText}`);
          withdrawInputRef.current?.focus();
          setWithdrawAmount("");
          await sleep(150);

          let typed = "";
          for (const char of amountText) {
            typed += char;
            setWithdrawAmount(typed);
            await sleep(140);
          }

          await sleep(300);
          skipNextApiActionRef.current = "withdraw";
          setBotStatus("Chatbot clicked Withdraw", 1200);
          withdrawBtnRef.current?.click();
        }
      };

      const processBotQueue = async () => {
        if (botActionInProgressRef.current) return;
        botActionInProgressRef.current = true;
        try {
          while (botActionQueueRef.current.length > 0) {
            const nextCommand = botActionQueueRef.current.shift();
            await runSingleBotAction(nextCommand);
            await sleep(250);
          }
        } finally {
          botActionInProgressRef.current = false;
        }
      };

      processBotQueue();
    };

    window.addEventListener("bank-chat-transaction", onBankChatTransaction);
    return () => {
      window.removeEventListener("bank-chat-transaction", onBankChatTransaction);
    };
  }, [token, actionLoading]);

  const handleDeposit = async () => {
    if (skipNextApiActionRef.current === "deposit") {
      skipNextApiActionRef.current = null;
      setDepositAmount("");
      await fetchData();
      setBotStatus("Dashboard updated", 1000);
      return;
    }
    if (!depositAmount || Number(depositAmount) <= 0) return;

    try {
      setActionLoading(true);
      await api.deposit(Number(depositAmount), token);
      setDepositAmount("");
      await fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (skipNextApiActionRef.current === "withdraw") {
      skipNextApiActionRef.current = null;
      setWithdrawAmount("");
      await fetchData();
      setBotStatus("Dashboard updated", 1000);
      return;
    }
    if (!withdrawAmount || Number(withdrawAmount) <= 0) return;
    if (Number(withdrawAmount) > balance) {
      alert("Insufficient balance");
      return;
    }

    try {
      setActionLoading(true);
      await api.withdraw(Number(withdrawAmount), token);
      setWithdrawAmount("");
      await fetchData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  // Calculate stats
  const totalDeposits = transactions
    .filter((t) => t.type === "deposit")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawals = transactions
    .filter((t) => t.type === "withdraw")
    .reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <motion.div
          style={styles.loadingSpinner}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles size={40} color="#059669" />
        </motion.div>
        <p style={styles.loadingText}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container} id="dashboard-container">
      {/* Background Effects */}
      <div style={styles.bgMesh}></div>
      <div style={styles.bgGradient}></div>

      {/* Header */}
      <motion.header
        style={styles.header}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div style={styles.headerLeft}>
          <div style={styles.logoWrapper}>
            <Wallet size={28} style={styles.logoIcon} />
          </div>
          <div>
            <h1 style={styles.logoText}>MyBank Pro</h1>
            <p style={styles.logoSubtext}>Premium Banking</p>
          </div>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>
              {(user?.email?.[0] || "U").toUpperCase()}
            </div>
            <div>
              <p style={styles.userName}>
                {user?.name || "User"}
              </p>
              <p style={styles.userEmail}>{user?.email || ""}</p>
            </div>
          </div>

          <motion.button
            id="logout-btn"
            onClick={handleLogout}
            style={styles.logoutBtn}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </motion.button>
        </div>
      </motion.header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Balance Card */}
        <motion.div
          style={styles.balanceCard}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          whileHover={{ y: -5, boxShadow: "0 20px 60px rgba(5, 150, 105, 0.3)" }}
        >
          <div style={styles.balanceCardGlow}></div>
          <div style={styles.balanceHeader}>
            <div>
              <p style={styles.balanceLabel}>Total Balance</p>
              <div style={styles.balanceAmount}>
                <span style={styles.currencySymbol}>₹</span>
                <motion.span
                  id="current-balance"
                  style={styles.balanceValue}
                  key={displayBalance}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {displayBalance.toLocaleString("en-IN")}
                </motion.span>
              </div>
            </div>
          </div>

          <div style={styles.statsRow}>
            <div style={styles.statItem}>
              <ArrowDownRight size={16} style={{ color: "#10b981" }} />
              <div>
                <p style={styles.statLabel}>Total Deposits</p>
                <p style={styles.statValue}>
                  ₹{totalDeposits.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            <div style={styles.statDivider}></div>
            <div style={styles.statItem}>
              <ArrowUpRight size={16} style={{ color: "#ef4444" }} />
              <div>
                <p style={styles.statLabel}>Total Withdrawals</p>
                <p style={styles.statValue}>
                  ₹{totalWithdrawals.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {botStatusMessage ? (
          <motion.div
            style={styles.botStatusPill}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {botStatusMessage}
          </motion.div>
        ) : null}

        {/* Action Cards Grid */}
        <div style={styles.actionGrid}>
          {/* Deposit Card */}
          <motion.div
            style={styles.actionCard}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(16, 185, 129, 0.2)" }}
          >
            <div style={styles.actionCardHeader}>
              <div style={styles.actionIconWrapper}>
                <TrendingUp size={24} style={{ color: "#10b981" }} />
              </div>
              <h3 style={styles.actionTitle}>Deposit Money</h3>
            </div>

            <input
              id="deposit-input"
              ref={depositInputRef}
              type="number"
              placeholder="Enter amount"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = "#10b981";
                e.target.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(0, 0, 0, 0.1)";
                e.target.style.boxShadow = "none";
              }}
            />

            <motion.button
              id="deposit-btn"
              ref={depositBtnRef}
              onClick={handleDeposit}
              disabled={actionLoading || !depositAmount}
              style={{
                ...styles.actionBtn,
                ...styles.depositBtn,
                ...(actionLoading || !depositAmount ? styles.actionBtnDisabled : {}),
              }}
              whileHover={!actionLoading && depositAmount ? { scale: 1.02 } : {}}
              whileTap={!actionLoading && depositAmount ? { scale: 0.98 } : {}}
            >
              {actionLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Activity size={18} />
                </motion.div>
              ) : (
                <>
                  <TrendingUp size={18} />
                  <span>Add Money</span>
                </>
              )}
            </motion.button>
          </motion.div>

          {/* Withdraw Card */}
          <motion.div
            style={styles.actionCard}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(239, 68, 68, 0.2)" }}
          >
            <div style={styles.actionCardHeader}>
              <div style={{...styles.actionIconWrapper, background: "rgba(239, 68, 68, 0.1)"}}>
                <TrendingDown size={24} style={{ color: "#ef4444" }} />
              </div>
              <h3 style={styles.actionTitle}>Withdraw Money</h3>
            </div>

            <input
              id="withdraw-input"
              ref={withdrawInputRef}
              type="number"
              placeholder="Enter amount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              style={styles.input}
              onFocus={(e) => {
                e.target.style.borderColor = "#ef4444";
                e.target.style.boxShadow = "0 0 0 3px rgba(239, 68, 68, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(0, 0, 0, 0.1)";
                e.target.style.boxShadow = "none";
              }}
            />

            <motion.button
              id="withdraw-btn"
              ref={withdrawBtnRef}
              onClick={handleWithdraw}
              disabled={actionLoading || !withdrawAmount}
              style={{
                ...styles.actionBtn,
                ...styles.withdrawBtn,
                ...(actionLoading || !withdrawAmount ? styles.actionBtnDisabled : {}),
              }}
              whileHover={!actionLoading && withdrawAmount ? { scale: 1.02 } : {}}
              whileTap={!actionLoading && withdrawAmount ? { scale: 0.98 } : {}}
            >
              {actionLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Activity size={18} />
                </motion.div>
              ) : (
                <>
                  <TrendingDown size={18} />
                  <span>Withdraw</span>
                </>
              )}
            </motion.button>
          </motion.div>
        </div>

        {/* Transactions */}
        <motion.div
          ref={transactionsSectionRef}
          style={styles.transactionsCard}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div style={styles.transactionsHeader}>
            <div style={styles.transactionsHeaderLeft}>
              <Clock size={24} style={{ color: "#059669" }} />
              <h3 style={styles.transactionsTitle}>Transaction History</h3>
            </div>
            <span style={styles.transactionsBadge}>
              {highlightedIndices.length > 0 
                ? `${highlightedIndices.length} highlighted` 
                : `${transactions.length} total`}
            </span>
          </div>

          {transactions.length === 0 ? (
            <div style={styles.emptyState}>
              <Activity size={48} style={{ color: "#d1d5db", opacity: 0.5 }} />
              <p style={styles.emptyStateText}>No transactions yet</p>
              <p style={styles.emptyStateSubtext}>
                Start by depositing money to your account
              </p>
            </div>
          ) : (
            <div style={styles.transactionsList}>
              <AnimatePresence>
                {transactions.map((t, i) => {
                  // ✅ Check if this transaction should be highlighted
                  const isHighlighted = highlightedIndices.includes(i);
                  
                  return (
                    <motion.div
                      key={i}
                      style={{
                        ...styles.transactionItem,
                        // ✅ Dynamic highlighting styles
                        ...(isHighlighted ? styles.highlightedTransaction : {}),
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: 1, 
                        x: 0,
                        // ✅ Pulse animation for highlighted items
                        ...(isHighlighted ? {
                          scale: [1, 1.02, 1],
                          transition: { duration: 0.6, repeat: 2 }
                        } : {})
                      }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ 
                        x: 8, 
                        backgroundColor: isHighlighted 
                          ? "rgba(5, 150, 105, 0.15)" 
                          : "rgba(5, 150, 105, 0.03)",
                        transition: { duration: 0.2 }
                      }}
                    >
                      <div style={styles.transactionLeft}>
                        <div
                          style={{
                            ...styles.transactionIcon,
                            background:
                              t.type === "deposit"
                                ? "rgba(16, 185, 129, 0.1)"
                                : "rgba(239, 68, 68, 0.1)",
                          }}
                        >
                          {t.type === "deposit" ? (
                            <ArrowDownRight size={18} style={{ color: "#10b981" }} />
                          ) : (
                            <ArrowUpRight size={18} style={{ color: "#ef4444" }} />
                          )}
                        </div>
                        <div>
                          <p style={styles.transactionType}>
                            {t.type === "deposit" ? "Money Deposited" : "Money Withdrawn"}
                          </p>
                          <p style={styles.transactionDate}>
                            {new Date(t.timestamp).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                      </div>

                      <div
                        style={{
                          ...styles.transactionAmount,
                          color: t.type === "deposit" ? "#10b981" : "#ef4444",
                        }}
                      >
                        {t.type === "deposit" ? "+" : "-"}₹
                        {t.amount.toLocaleString("en-IN")}
                      </div>
                      
                      {/* ✅ Highlight indicator badge */}
                      {isHighlighted && (
                        <div style={styles.highlightBadge}>
                          <Sparkles size={12} />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');

        * {
          box-sizing: border-box;
        }

        @keyframes meshMove {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(5%, 5%) scale(1.1); }
        }

        @keyframes gradientRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }

        @keyframes glow {
          0%, 100% { box-shadow: 0 0 10px rgba(5, 150, 105, 0.4); }
          50% { box-shadow: 0 0 20px rgba(5, 150, 105, 0.6); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdfa 100%)",
    fontFamily: "'Sora', -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative",
    overflow: "hidden",
  },

  // Background effects
  bgMesh: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(circle at 20% 30%, rgba(5, 150, 105, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(245, 158, 11, 0.06) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.04) 0%, transparent 60%)
    `,
    animation: "meshMove 20s ease-in-out infinite",
    pointerEvents: "none",
  },

  bgGradient: {
    position: "absolute",
    top: "-50%",
    right: "-50%",
    width: "100%",
    height: "100%",
    background: "radial-gradient(circle, rgba(5, 150, 105, 0.1) 0%, transparent 70%)",
    animation: "gradientRotate 30s linear infinite",
    pointerEvents: "none",
  },

  // Loading
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
    gap: "20px",
  },

  loadingSpinner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#059669",
    fontFamily: "'Sora', sans-serif",
  },

  // Header
  header: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    borderBottom: "1px solid rgba(5, 150, 105, 0.1)",
    padding: "20px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },

  logoWrapper: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)",
  },

  logoIcon: {
    color: "#ffffff",
  },

  logoText: {
    fontSize: "24px",
    fontWeight: "800",
    background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "-0.5px",
  },

  logoSubtext: {
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: "600",
    marginTop: "-2px",
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
  },

  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  userAvatar: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "700",
    color: "#ffffff",
    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
  },

  userName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
  },

  userEmail: {
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "2px",
  },

  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    background: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontFamily: "inherit",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  },

  // Main content
  main: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "40px",
    position: "relative",
    zIndex: 10,
  },

  // Balance card
  balanceCard: {
    position: "relative",
    background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    borderRadius: "24px",
    padding: "40px",
    marginBottom: "32px",
    boxShadow: "0 12px 40px rgba(5, 150, 105, 0.25)",
    overflow: "hidden",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  },

  balanceCardGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 60%)",
    animation: "pulse 3s ease-in-out infinite",
    pointerEvents: "none",
  },

  balanceHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px",
    position: "relative",
    zIndex: 2,
  },

  balanceLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: "8px",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },

  balanceAmount: {
    display: "flex",
    alignItems: "baseline",
    gap: "4px",
  },

  currencySymbol: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#ffffff",
  },

  balanceValue: {
    fontSize: "56px",
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: "-1px",
  },

  balanceIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "16px",
    background: "rgba(255, 255, 255, 0.15)",
    backdropFilter: "blur(10px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
  },

  statsRow: {
    display: "flex",
    gap: "24px",
    position: "relative",
    zIndex: 2,
  },

  statItem: {
    flex: 1,
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },

  statDivider: {
    width: "1px",
    background: "rgba(255, 255, 255, 0.2)",
  },

  statLabel: {
    fontSize: "12px",
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
    marginBottom: "4px",
  },

  statValue: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#ffffff",
  },

  // Action cards
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
    marginBottom: "32px",
  },

  botStatusPill: {
    marginBottom: "16px",
    padding: "10px 14px",
    borderRadius: "12px",
    background: "rgba(5, 150, 105, 0.08)",
    color: "#047857",
    border: "1px solid rgba(5, 150, 105, 0.2)",
    fontSize: "14px",
    fontWeight: "600",
    width: "fit-content",
  },

  actionCard: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
    border: "1px solid rgba(0, 0, 0, 0.05)",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  },

  actionCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
  },

  actionIconWrapper: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "rgba(16, 185, 129, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  actionTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#111827",
  },

  input: {
    width: "100%",
    padding: "14px 18px",
    fontSize: "16px",
    fontWeight: "500",
    border: "2px solid rgba(0, 0, 0, 0.1)",
    borderRadius: "12px",
    outline: "none",
    transition: "all 0.3s ease",
    fontFamily: "inherit",
    marginBottom: "16px",
    background: "#f9fafb",
  },

  actionBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "14px 24px",
    fontSize: "15px",
    fontWeight: "700",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontFamily: "inherit",
  },

  depositBtn: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#ffffff",
    boxShadow: "0 4px 16px rgba(16, 185, 129, 0.3)",
  },

  withdrawBtn: {
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    color: "#ffffff",
    boxShadow: "0 4px 16px rgba(239, 68, 68, 0.3)",
  },

  actionBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },

  // Transactions
  transactionsCard: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
    border: "1px solid rgba(0, 0, 0, 0.05)",
  },

  transactionsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "2px solid #f3f4f6",
  },

  transactionsHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  transactionsTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#111827",
  },

  transactionsBadge: {
    padding: "6px 16px",
    background: "rgba(5, 150, 105, 0.1)",
    color: "#059669",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "700",
  },

  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    gap: "12px",
  },

  emptyStateText: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#6b7280",
  },

  emptyStateSubtext: {
    fontSize: "14px",
    color: "#9ca3af",
  },

  transactionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },

  transactionItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    borderRadius: "12px",
    transition: "all 0.2s ease",
    cursor: "pointer",
    position: "relative",
  },

  // ✅ NEW: Highlighted transaction styles
  highlightedTransaction: {
    background: "rgba(5, 150, 105, 0.08)",
    border: "2px solid rgba(5, 150, 105, 0.3)",
    animation: "glow 2s ease-in-out infinite",
  },

  // ✅ NEW: Highlight badge
  highlightBadge: {
    position: "absolute",
    top: "8px",
    right: "8px",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    boxShadow: "0 2px 8px rgba(5, 150, 105, 0.4)",
  },

  transactionLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },

  transactionIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  transactionType: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#111827",
    marginBottom: "4px",
  },

  transactionDate: {
    fontSize: "13px",
    color: "#6b7280",
  },

  transactionAmount: {
    fontSize: "18px",
    fontWeight: "700",
  },
};