import { useState, useEffect, createContext, useContext } from "react";
import {
  loginAPI, registerAPI, getAllDoctorsAPI, applyDoctorAPI,
  getNotificationsAPI, markNotificationsSeenAPI, getDoctorProfileAPI,
  updateDoctorProfileAPI, getDoctorAppointmentsAPI, updateAppointmentStatusAPI,
  bookAppointmentAPI, getUserAppointmentsAPI, cancelAppointmentAPI,
  getAdminStatsAPI, getAllUsersAPI, getAllDoctorsAdminAPI, updateDoctorStatusAPI,
  deleteUserAPI, deleteDoctorAPI, getAllAppointmentsAdminAPI,
} from "./api";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const theme = {
  teal: "#0D9488", tealLight: "#14B8A6", tealDark: "#0F766E",
  navy: "#0F172A", navyMid: "#1E293B", slate: "#334155",
  muted: "#64748B", border: "#E2E8F0", bg: "#F8FAFC",
  white: "#FFFFFF", danger: "#EF4444", warning: "#F59E0B",
  success: "#10B981", purple: "#8B5CF6",
};

const styles = {
  page: { minHeight: "100vh", background: theme.bg, fontFamily: "'Inter', system-ui, sans-serif", color: theme.navy },
  card: { background: theme.white, borderRadius: 16, border: `1px solid ${theme.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" },
  btn: (v = "primary") => ({
    padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, transition: "all 0.15s ease",
    ...(v === "primary" && { background: `linear-gradient(135deg, ${theme.teal}, ${theme.tealDark})`, color: "#fff", boxShadow: "0 2px 8px rgba(13,148,136,0.35)" }),
    ...(v === "outline" && { background: "transparent", color: theme.teal, border: `1.5px solid ${theme.teal}` }),
    ...(v === "danger" && { background: theme.danger, color: "#fff" }),
    ...(v === "ghost" && { background: "transparent", color: theme.muted, padding: "8px 12px" }),
  }),
  input: { width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${theme.border}`, fontSize: 14, outline: "none", transition: "border-color 0.15s", boxSizing: "border-box", background: theme.white },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: theme.slate, marginBottom: 6 },
  badge: (color) => ({
    display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
    ...(color === "green" && { background: "#DCFCE7", color: "#16A34A" }),
    ...(color === "yellow" && { background: "#FEF9C3", color: "#A16207" }),
    ...(color === "red" && { background: "#FEE2E2", color: "#DC2626" }),
    ...(color === "blue" && { background: "#DBEAFE", color: "#2563EB" }),
    ...(color === "purple" && { background: "#EDE9FE", color: "#7C3AED" }),
    ...(color === "gray" && { background: "#F1F5F9", color: theme.muted }),
  }),
};

// ─── AUTH CONTEXT ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

// ─── TOAST ────────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);
let toastId = 0;
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const show = (message, type = "info") => {
    const id = ++toastId;
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: t.type === "success" ? theme.success : t.type === "error" ? theme.danger : theme.navy, color: "#fff", padding: "12px 18px", borderRadius: 12, fontSize: 14, fontWeight: 500, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", minWidth: 260, animation: "slideIn 0.2s ease", display: "flex", alignItems: "center", gap: 10 }}>
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "●"} {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
const useToast = () => useContext(ToastContext);

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const icons = {
    home: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    stethoscope: <><path d="M4.8 2.3A.3.3 0 105 2H4a2 2 0 00-2 2v5a6 6 0 006 6 6 6 0 006-6V4a2 2 0 00-2-2h-1a.2.2 0 10.3.3"/><path d="M8 15v1a6 6 0 006 6v0a6 6 0 006-6v-4"/><circle cx="20" cy="10" r="2"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></>,
    edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    dollar: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    map: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>,
    activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
};

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar({ onNav, currentPage, onLogout }) {
  const { user } = useAuth();
  const { show } = useToast();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifData, setNotifData] = useState({ notification: [], seenNotification: [] });

  useEffect(() => {
    if (!user) return;
    getNotificationsAPI()
      .then(res => {
        if (res.success && res.data) {
          setNotifData({
            notification: res.data.notification || [],
            seenNotification: res.data.seenNotification || [],
          });
        }
      })
      .catch(() => {});
  }, [user, currentPage]);

  const markSeen = async () => {
    await markNotificationsSeenAPI();
    setNotifData(p => ({ ...p, seenNotification: [...p.seenNotification, ...p.notification], notification: [] }));
    show("Notifications marked as read", "success");
  };

  const navLinks = user?.type === "admin"
    ? [{ label: "Dashboard", page: "admin-dashboard", icon: "home" }, { label: "Users", page: "admin-users", icon: "users" }, { label: "Doctors", page: "admin-doctors", icon: "stethoscope" }, { label: "Appointments", page: "admin-appointments", icon: "calendar" }]
    : user?.type === "doctor"
    ? [{ label: "Dashboard", page: "doctor-dashboard", icon: "home" }, { label: "Appointments", page: "doctor-appointments", icon: "calendar" }, { label: "Profile", page: "doctor-profile", icon: "user" }]
    : [{ label: "Home", page: "home", icon: "home" }, { label: "Appointments", page: "appointments", icon: "calendar" }, { label: "Apply as Doctor", page: "apply-doctor", icon: "stethoscope" }, { label: "Profile", page: "profile", icon: "user" }];

  return (
    <nav style={{ background: theme.white, borderBottom: `1px solid ${theme.border}`, padding: "0 24px", position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => onNav(user?.type === "admin" ? "admin-dashboard" : user?.type === "doctor" ? "doctor-dashboard" : "home")}>
        <div style={{ background: `linear-gradient(135deg, ${theme.teal}, ${theme.tealDark})`, borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="stethoscope" size={20} color="#fff" />
        </div>
        <span style={{ fontWeight: 800, fontSize: 20, color: theme.navy }}>DocSpot</span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {navLinks.map(link => (
          <button key={link.page} onClick={() => onNav(link.page)} style={{ ...styles.btn(currentPage === link.page ? "primary" : "ghost"), display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <Icon name={link.icon} size={15} />{link.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ position: "relative" }}>
          <button onClick={() => setNotifOpen(!notifOpen)} style={{ ...styles.btn("ghost"), position: "relative", padding: 8 }}>
            <Icon name="bell" size={20} />
            {notifData.notification.length > 0 && (
              <span style={{ position: "absolute", top: 4, right: 4, background: theme.danger, color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                {notifData.notification.length}
              </span>
            )}
          </button>
          {notifOpen && (
            <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 340, ...styles.card, zIndex: 200 }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
                <button onClick={markSeen} style={{ ...styles.btn("ghost"), fontSize: 12, padding: "4px 8px", color: theme.teal }}>Mark all read</button>
              </div>
              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                {[...notifData.notification.map(n => ({ ...n, unread: true })), ...notifData.seenNotification.slice(-5).map(n => ({ ...n, unread: false }))].map((n, i) => (
                  <div key={i} style={{ padding: "12px 16px", borderBottom: `1px solid ${theme.border}`, background: n.unread ? "#F0FDFA" : "transparent" }}>
                    <p style={{ margin: 0, fontSize: 13, color: theme.slate }}>{n.message}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: theme.muted }}>{new Date(n.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
                {notifData.notification.length === 0 && notifData.seenNotification.length === 0 && (
                  <p style={{ padding: 20, textAlign: "center", color: theme.muted, fontSize: 13 }}>No notifications</p>
                )}
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${theme.teal}, ${theme.tealDark})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: theme.slate }}>{user?.name}</span>
        </div>
        <button onClick={onLogout} style={{ ...styles.btn("outline"), display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <Icon name="logout" size={15} />Logout
        </button>
      </div>
    </nav>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin, onGoRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { show } = useToast();

  const handleSubmit = async () => {
    if (!email || !password) { show("Email and password required", "error"); return; }
    setLoading(true);
    try {
      const res = await loginAPI(email, password);
      if (res.success) {
        // ✅ Store the JWT token in localStorage
        localStorage.setItem("docspot_token", res.data.token);
        localStorage.setItem("docspot_user", JSON.stringify(res.data.user));
        onLogin(res.data);
      } else {
        show(res.message, "error");
      }
    } catch (err) {
      show(err.response?.data?.message || "Login failed. Is the server running?", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${theme.teal}22, ${theme.bg} 50%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ background: `linear-gradient(135deg, ${theme.teal}, ${theme.tealDark})`, borderRadius: 14, width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="stethoscope" size={26} color="#fff" />
            </div>
            <span style={{ fontWeight: 900, fontSize: 28, color: theme.navy }}>DocSpot</span>
          </div>
          <p style={{ color: theme.muted, margin: 0, fontSize: 15 }}>Seamless Appointment Booking for Health</p>
        </div>
        <div style={{ ...styles.card, padding: 32 }}>
          <h2 style={{ margin: "0 0 24px", fontWeight: 800, fontSize: 22 }}>Welcome back</h2>
          <div style={{ marginBottom: 16 }}>
            <label style={styles.label}>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={styles.input} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={styles.label}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={styles.input} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>
          <button onClick={handleSubmit} disabled={loading} style={{ ...styles.btn("primary"), width: "100%", padding: "12px", fontSize: 15 }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <span style={{ fontSize: 13, color: theme.muted }}>Don't have an account? </span>
            <button onClick={onGoRegister} style={{ ...styles.btn("ghost"), padding: 0, color: theme.teal, fontWeight: 700, fontSize: 13 }}>Register</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────
function RegisterPage({ onGoLogin }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const { show } = useToast();
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) { show("All fields required", "error"); return; }
    setLoading(true);
    try {
      const res = await registerAPI(form.name, form.email, form.password, form.phone);
      if (res.success) { show("Registered! Please login.", "success"); onGoLogin(); }
      else show(res.message, "error");
    } catch (err) {
      show(err.response?.data?.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${theme.teal}22, ${theme.bg} 50%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: `linear-gradient(135deg, ${theme.teal}, ${theme.tealDark})`, borderRadius: 14, width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="stethoscope" size={26} color="#fff" />
            </div>
            <span style={{ fontWeight: 900, fontSize: 28, color: theme.navy }}>DocSpot</span>
          </div>
        </div>
        <div style={{ ...styles.card, padding: 32 }}>
          <h2 style={{ margin: "0 0 24px", fontWeight: 800, fontSize: 22 }}>Create account</h2>
          {[{ k: "name", label: "Full Name", type: "text", ph: "John Smith" }, { k: "email", label: "Email", type: "email", ph: "your@email.com" }, { k: "phone", label: "Phone (optional)", type: "tel", ph: "+91 98765 43210" }, { k: "password", label: "Password", type: "password", ph: "••••••••" }].map(f => (
            <div key={f.k} style={{ marginBottom: 16 }}>
              <label style={styles.label}>{f.label}</label>
              <input type={f.type} value={form[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} style={styles.input} />
            </div>
          ))}
          <button onClick={handleSubmit} disabled={loading} style={{ ...styles.btn("primary"), width: "100%", padding: "12px", fontSize: 15, marginTop: 8 }}>
            {loading ? "Creating..." : "Create Account"}
          </button>
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <span style={{ fontSize: 13, color: theme.muted }}>Already have an account? </span>
            <button onClick={onGoLogin} style={{ ...styles.btn("ghost"), padding: 0, color: theme.teal, fontWeight: 700, fontSize: 13 }}>Login</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ ...styles.card, padding: 24, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={icon} size={26} color={color} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 13, color: theme.muted, fontWeight: 500 }}>{label}</p>
        <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 800, color: theme.navy }}>{value}</p>
      </div>
    </div>
  );
}

// ─── HOME (Patient) ───────────────────────────────────────────────────────────
function HomePage({ onNav }) {
  const { user } = useAuth();
  const { show } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [specFilter, setSpecFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllDoctorsAPI()
      .then(res => { if (res.success) setDoctors(res.data); })
      .catch(() => show("Failed to load doctors", "error"))
      .finally(() => setLoading(false));
  }, []);

  const specs = ["all", ...new Set(doctors.map(d => d.specialization))];
  const filtered = doctors.filter(d =>
    (specFilter === "all" || d.specialization === specFilter) &&
    (d.fullname.toLowerCase().includes(search.toLowerCase()) || d.specialization.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ background: `linear-gradient(135deg, ${theme.teal}, ${theme.tealDark})`, borderRadius: 20, padding: "48px 40px", marginBottom: 32, color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <h1 style={{ margin: "0 0 12px", fontSize: 36, fontWeight: 900 }}>Hello, {user?.name?.split(" ")[0]} 👋</h1>
        <p style={{ margin: "0 0 24px", fontSize: 16, opacity: 0.9 }}>Book appointments with top specialists near you</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {specs.filter(s => s !== "all").slice(0, 4).map(s => (
            <span key={s} onClick={() => setSpecFilter(s)} style={{ background: "rgba(255,255,255,0.2)", padding: "6px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer", fontWeight: 500 }}>{s}</span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><Icon name="search" size={16} color={theme.muted} /></div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search doctors..." style={{ ...styles.input, paddingLeft: 38 }} />
        </div>
        <select value={specFilter} onChange={e => setSpecFilter(e.target.value)} style={{ ...styles.input, width: "auto", cursor: "pointer" }}>
          {specs.map(s => <option key={s} value={s}>{s === "all" ? "All Specializations" : s}</option>)}
        </select>
      </div>
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: theme.muted }}>Loading doctors...</div>
      ) : (
        <>
          <h2 style={{ margin: "0 0 20px", fontWeight: 800, fontSize: 20 }}>Available Doctors ({filtered.length})</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {filtered.map(doc => (
              <div key={doc._id} style={{ ...styles.card, transition: "transform 0.2s, box-shadow 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                <div style={{ background: `linear-gradient(135deg, ${theme.teal}15, ${theme.tealLight}08)`, padding: 20, display: "flex", gap: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg, ${theme.teal}, ${theme.tealDark})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 22, flexShrink: 0 }}>
                    {doc.fullname?.charAt(3)?.toUpperCase() || "D"}
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 16 }}>{doc.fullname}</h3>
                    <span style={styles.badge("blue")}>{doc.specialization}</span>
                  </div>
                </div>
                <div style={{ padding: 20 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {[{ icon: "activity", text: `${doc.experience} years experience` }, { icon: "dollar", text: `₹${doc.fees} consultation fee` }, { icon: "clock", text: `${doc.timings?.[0] || "09:00"} - ${doc.timings?.[1] || "17:00"}` }, { icon: "map", text: doc.address }].map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: theme.slate }}>
                        <Icon name={item.icon} size={14} color={theme.teal} /><span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => onNav("book-appointment", doc)} style={{ ...styles.btn("primary"), width: "100%", fontSize: 14 }}>Book Appointment</button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: theme.muted }}>No doctors found</div>}
          </div>
        </>
      )}
    </div>
  );
}

// ─── BOOK APPOINTMENT ─────────────────────────────────────────────────────────
function BookAppointmentPage({ doctor, onNav }) {
  const { show } = useToast();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [docFile, setDocFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const timeSlots = [];
  const [sh, sm] = (doctor?.timings?.[0] || "09:00").split(":").map(Number);
  const [eh, em] = (doctor?.timings?.[1] || "17:00").split(":").map(Number);
  let cur = sh * 60 + sm;
  while (cur < eh * 60 + em) {
    timeSlots.push(`${String(Math.floor(cur / 60)).padStart(2, "0")}:${String(cur % 60).padStart(2, "0")}`);
    cur += 30;
  }

  const handleBook = async () => {
    if (!date || !time) { show("Select date and time", "error"); return; }
    setLoading(true);
    try {
      // ✅ Calls real backend — sends JWT automatically via axios interceptor
      const res = await bookAppointmentAPI(doctor._id, date, time, docFile);
      if (res.success) { show("Appointment booked!", "success"); onNav("appointments"); }
      else show(res.message, "error");
    } catch (err) {
      show(err.response?.data?.message || "Booking failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 700, margin: "0 auto" }}>
      <button onClick={() => onNav("home")} style={{ ...styles.btn("ghost"), marginBottom: 20, color: theme.teal }}>← Back to Doctors</button>
      <div style={styles.card}>
        <div style={{ background: `linear-gradient(135deg, ${theme.teal}, ${theme.tealDark})`, padding: 28, color: "#fff", borderRadius: "16px 16px 0 0" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800 }}>
              {doctor?.fullname?.charAt(3)?.toUpperCase() || "D"}
            </div>
            <div>
              <h2 style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 22 }}>{doctor?.fullname}</h2>
              <p style={{ margin: 0, opacity: 0.85, fontSize: 14 }}>{doctor?.specialization} • {doctor?.experience} yrs exp • ₹{doctor?.fees}</p>
            </div>
          </div>
        </div>
        <div style={{ padding: 32 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={styles.label}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} style={styles.input} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={styles.label}>Time Slot</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {timeSlots.map(t => (
                <button key={t} onClick={() => setTime(t)} style={{ padding: "10px 8px", borderRadius: 10, border: `1.5px solid ${time === t ? theme.teal : theme.border}`, background: time === t ? `${theme.teal}15` : theme.white, color: time === t ? theme.teal : theme.slate, fontWeight: time === t ? 700 : 500, fontSize: 13, cursor: "pointer" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={styles.label}>Upload Document (optional — medical records, insurance)</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => setDocFile(e.target.files[0])} style={{ ...styles.input, padding: "8px" }} />
            {docFile && <p style={{ margin: "6px 0 0", fontSize: 12, color: theme.teal }}>✓ {docFile.name}</p>}
          </div>
          {date && time && (
            <div style={{ background: `${theme.teal}10`, border: `1px solid ${theme.teal}30`, borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <p style={{ margin: 0, fontSize: 14, color: theme.tealDark, fontWeight: 600 }}>
                📅 {new Date(date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} at {time}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: theme.muted }}>Consultation fee: ₹{doctor?.fees}</p>
            </div>
          )}
          <button onClick={handleBook} disabled={loading} style={{ ...styles.btn("primary"), width: "100%", padding: "14px", fontSize: 15 }}>
            {loading ? "Booking..." : "Confirm Appointment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── USER APPOINTMENTS ────────────────────────────────────────────────────────
function AppointmentsPage() {
  const { show } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const statusColor = { pending: "yellow", scheduled: "green", completed: "blue", cancelled: "gray" };

  const load = () => {
    setLoading(true);
    getUserAppointmentsAPI()
      .then(res => { if (res.success) setAppointments(res.data); })
      .catch(() => show("Failed to load appointments", "error"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const cancel = async (id) => {
    try {
      const res = await cancelAppointmentAPI(id);
      if (res.success) { show("Appointment cancelled", "success"); load(); }
    } catch { show("Failed to cancel", "error"); }
  };

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 24px", fontWeight: 800, fontSize: 26 }}>My Appointments</h1>
      {loading ? <div style={{ textAlign: "center", padding: 60, color: theme.muted }}>Loading...</div> :
        appointments.length === 0 ? (
          <div style={{ ...styles.card, padding: 60, textAlign: "center" }}>
            <Icon name="calendar" size={48} color={theme.border} />
            <p style={{ marginTop: 16, color: theme.muted }}>No appointments yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {appointments.map(a => (
              <div key={a._id} style={{ ...styles.card, padding: 24, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${theme.teal}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="stethoscope" size={22} color={theme.teal} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>{a.doctorInfo?.fullname}</h3>
                    <span style={styles.badge(statusColor[a.status] || "gray")}>{a.status}</span>
                  </div>
                  <p style={{ margin: "0 0 8px", fontSize: 13, color: theme.muted }}>{a.doctorInfo?.specialization}</p>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, color: theme.slate, display: "flex", alignItems: "center", gap: 4 }}><Icon name="calendar" size={13} color={theme.teal} />{new Date(a.date).toLocaleDateString("en-IN")}</span>
                    <span style={{ fontSize: 13, color: theme.slate, display: "flex", alignItems: "center", gap: 4 }}><Icon name="clock" size={13} color={theme.teal} />{a.time}</span>
                    <span style={{ fontSize: 13, color: theme.slate, display: "flex", alignItems: "center", gap: 4 }}><Icon name="dollar" size={13} color={theme.teal} />₹{a.doctorInfo?.fees}</span>
                  </div>
                </div>
                {["pending", "scheduled"].includes(a.status) && (
                  <button onClick={() => cancel(a._id)} style={{ ...styles.btn("danger"), fontSize: 13 }}>Cancel</button>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── APPLY DOCTOR ─────────────────────────────────────────────────────────────
function ApplyDoctorPage() {
  const { user } = useAuth();
  const { show } = useToast();
  const [form, setForm] = useState({ fullname: user?.name || "", email: user?.email || "", phone: user?.phone || "", address: "", specialization: "", experience: "", fees: "", timings: ["09:00", "17:00"] });
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState(null);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    getDoctorProfileAPI().then(res => { if (res.success) setExisting(res.data); }).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!form.fullname || !form.specialization || !form.experience || !form.fees || !form.address) { show("All fields required", "error"); return; }
    setLoading(true);
    try {
      const res = await applyDoctorAPI({ ...form, experience: Number(form.experience), fees: Number(form.fees) });
      if (res.success) { show("Application submitted!", "success"); setExisting({ status: "pending" }); }
      else show(res.message, "error");
    } catch (err) {
      show(err.response?.data?.message || "Submission failed", "error");
    } finally { setLoading(false); }
  };

  if (existing) {
    const col = { pending: "yellow", approved: "green", rejected: "red" };
    return (
      <div style={{ padding: 32, maxWidth: 600, margin: "0 auto" }}>
        <div style={{ ...styles.card, padding: 40, textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: `${theme.teal}20`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Icon name="stethoscope" size={36} color={theme.teal} />
          </div>
          <h2 style={{ margin: "0 0 16px", fontWeight: 800 }}>Application Status</h2>
          <span style={{ ...styles.badge(col[existing.status] || "gray"), fontSize: 16, padding: "8px 20px" }}>{existing.status?.toUpperCase()}</span>
          <p style={{ marginTop: 20, color: theme.muted, fontSize: 14 }}>
            {existing.status === "pending" && "Your application is under review."}
            {existing.status === "approved" && "Congratulations! Your doctor account is active."}
            {existing.status === "rejected" && "Your application was not approved."}
          </p>
        </div>
      </div>
    );
  }

  const specs = ["Cardiologist", "Dermatologist", "Neurologist", "Orthopedist", "Pediatrician", "Psychiatrist", "Gynecologist", "Ophthalmologist", "ENT Specialist", "General Physician"];

  return (
    <div style={{ padding: 32, maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 26 }}>Apply as Doctor</h1>
      <p style={{ margin: "0 0 28px", color: theme.muted }}>Fill in your details. Admin will review your application.</p>
      <div style={{ ...styles.card, padding: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {[{ k: "fullname", label: "Full Name" }, { k: "email", label: "Email" }, { k: "phone", label: "Phone" }, { k: "experience", label: "Experience (years)" }, { k: "fees", label: "Consultation Fees (₹)" }].map(f => (
            <div key={f.k}>
              <label style={styles.label}>{f.label}</label>
              <input value={form[f.k]} onChange={e => set(f.k, e.target.value)} style={styles.input} />
            </div>
          ))}
          <div>
            <label style={styles.label}>Specialization</label>
            <select value={form.specialization} onChange={e => set("specialization", e.target.value)} style={{ ...styles.input, cursor: "pointer" }}>
              <option value="">Select...</option>
              {specs.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 20 }}>
          <label style={styles.label}>Clinic Address</label>
          <input value={form.address} onChange={e => set("address", e.target.value)} style={styles.input} />
        </div>
        <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {[["Start Time", 0], ["End Time", 1]].map(([label, idx]) => (
            <div key={idx}>
              <label style={styles.label}>{label}</label>
              <input type="time" value={form.timings[idx]} onChange={e => { const t = [...form.timings]; t[idx] = e.target.value; set("timings", t); }} style={styles.input} />
            </div>
          ))}
        </div>
        <button onClick={handleSubmit} disabled={loading} style={{ ...styles.btn("primary"), width: "100%", padding: "14px", fontSize: 15, marginTop: 28 }}>
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </div>
  );
}

// ─── DOCTOR DASHBOARD ─────────────────────────────────────────────────────────
function DoctorDashboard({ onNav }) {
  const { show } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const statusColor = { pending: "yellow", scheduled: "green", completed: "blue", cancelled: "gray" };

  const load = async () => {
    try {
      const [dRes, aRes] = await Promise.all([getDoctorProfileAPI(), getDoctorAppointmentsAPI()]);
      if (dRes.success) setDoctor(dRes.data);
      if (aRes.success) setAppointments(aRes.data);
    } catch { show("Failed to load data", "error"); }
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await updateAppointmentStatusAPI(id, status);
      show(`Appointment ${status}`, "success");
      load();
    } catch { show("Update failed", "error"); }
  };

  const stats = [
    { icon: "calendar", label: "Total", value: appointments.length, color: theme.teal },
    { icon: "clock", label: "Pending", value: appointments.filter(a => a.status === "pending").length, color: theme.warning },
    { icon: "check", label: "Scheduled", value: appointments.filter(a => a.status === "scheduled").length, color: theme.success },
    { icon: "dollar", label: "Fees/Visit", value: `₹${doctor?.fees || 0}`, color: theme.purple },
  ];

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 26 }}>Doctor Dashboard</h1>
          <p style={{ margin: 0, color: theme.muted }}>{doctor?.specialization} • {doctor?.experience} years</p>
        </div>
        <button onClick={() => onNav("doctor-profile")} style={{ ...styles.btn("outline"), display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="edit" size={15} /> Edit Profile
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>
      <div style={styles.card}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${theme.border}` }}>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>Appointment Requests</h2>
        </div>
        {appointments.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: theme.muted }}>No appointments yet</div>
        ) : appointments.map(a => (
          <div key={a._id} style={{ padding: "16px 24px", borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${theme.teal}15`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: theme.teal }}>
              {a.userInfo?.name?.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{a.userInfo?.name}</span>
                <span style={styles.badge(statusColor[a.status] || "gray")}>{a.status}</span>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <span style={{ fontSize: 12, color: theme.muted }}>{new Date(a.date).toLocaleDateString("en-IN")} at {a.time}</span>
                <span style={{ fontSize: 12, color: theme.muted }}>{a.userInfo?.phone}</span>
              </div>
            </div>
            {a.status === "pending" && (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => updateStatus(a._id, "scheduled")} style={{ ...styles.btn("primary"), fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><Icon name="check" size={14} />Approve</button>
                <button onClick={() => updateStatus(a._id, "cancelled")} style={{ ...styles.btn("danger"), fontSize: 13 }}>Reject</button>
              </div>
            )}
            {a.status === "scheduled" && (
              <button onClick={() => updateStatus(a._id, "completed")} style={{ ...styles.btn("outline"), fontSize: 13 }}>Mark Complete</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DOCTOR PROFILE ───────────────────────────────────────────────────────────
function DoctorProfilePage() {
  const { show } = useToast();
  const [form, setForm] = useState({ fullname: "", email: "", phone: "", address: "", specialization: "", experience: "", fees: "", timings: ["09:00", "17:00"] });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    getDoctorProfileAPI().then(res => { if (res.success) setForm(res.data); }).catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      const res = await updateDoctorProfileAPI({ ...form, experience: Number(form.experience), fees: Number(form.fees) });
      if (res.success) show("Profile updated!", "success");
    } catch { show("Update failed", "error"); }
  };

  return (
    <div style={{ padding: 32, maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 24px", fontWeight: 800, fontSize: 26 }}>My Profile</h1>
      <div style={{ ...styles.card, padding: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {[{ k: "fullname", label: "Full Name" }, { k: "email", label: "Email" }, { k: "phone", label: "Phone" }, { k: "experience", label: "Experience (years)" }, { k: "fees", label: "Fees (₹)" }, { k: "specialization", label: "Specialization" }].map(f => (
            <div key={f.k}>
              <label style={styles.label}>{f.label}</label>
              <input value={form[f.k] || ""} onChange={e => set(f.k, e.target.value)} style={styles.input} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20 }}>
          <label style={styles.label}>Address</label>
          <input value={form.address || ""} onChange={e => set("address", e.target.value)} style={styles.input} />
        </div>
        <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {[["Start Time", 0], ["End Time", 1]].map(([label, idx]) => (
            <div key={idx}>
              <label style={styles.label}>{label}</label>
              <input type="time" value={form.timings?.[idx] || ""} onChange={e => { const t = [...(form.timings || [])]; t[idx] = e.target.value; set("timings", t); }} style={styles.input} />
            </div>
          ))}
        </div>
        <button onClick={handleSave} style={{ ...styles.btn("primary"), width: "100%", padding: "14px", marginTop: 28 }}>Save Changes</button>
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
function AdminDashboard() {
  const { show } = useToast();
  const [stats, setStats] = useState({ totalUsers: 0, totalDoctors: 0, totalAppointments: 0, pendingDoctors: 0 });

  useEffect(() => {
    getAdminStatsAPI().then(res => { if (res.success) setStats(res.data); }).catch(() => show("Failed to load stats", "error"));
  }, []);

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 26 }}>Admin Dashboard</h1>
      <p style={{ margin: "0 0 32px", color: theme.muted }}>Platform overview</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <StatCard icon="users" label="Total Patients" value={stats.totalUsers} color={theme.teal} />
        <StatCard icon="stethoscope" label="Active Doctors" value={stats.totalDoctors} color={theme.purple} />
        <StatCard icon="calendar" label="Total Appointments" value={stats.totalAppointments} color={theme.success} />
        <StatCard icon="clock" label="Pending Approvals" value={stats.pendingDoctors} color={theme.warning} />
      </div>
      <div style={{ ...styles.card, padding: 32, textAlign: "center" }}>
        <Icon name="shield" size={48} color={theme.teal} />
        <h2 style={{ marginTop: 16, fontWeight: 700 }}>Platform is running</h2>
        <p style={{ color: theme.muted }}>Use the navigation to manage users, doctors, and appointments.</p>
      </div>
    </div>
  );
}

// ─── ADMIN USERS ──────────────────────────────────────────────────────────────
function AdminUsersPage() {
  const { show } = useToast();
  const [users, setUsers] = useState([]);

  const load = () => {
    getAllUsersAPI().then(res => { if (res.success) setUsers(res.data); }).catch(() => show("Failed to load", "error"));
  };
  useEffect(load, []);

  const del = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try { await deleteUserAPI(id); show("User deleted", "success"); load(); }
    catch { show("Delete failed", "error"); }
  };

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 24px", fontWeight: 800, fontSize: 26 }}>Manage Users</h1>
      <div style={styles.card}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${theme.border}` }}>
                {["Name", "Email", "Phone", "Role", "Actions"].map(h => (
                  <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: theme.muted, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${theme.teal}20`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: theme.teal }}>{u.name?.charAt(0)}</div>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: 13, color: theme.muted }}>{u.email}</td>
                  <td style={{ padding: "14px 20px", fontSize: 13, color: theme.muted }}>{u.phone || "—"}</td>
                  <td style={{ padding: "14px 20px" }}><span style={styles.badge(u.type === "doctor" ? "blue" : "gray")}>{u.type}</span></td>
                  <td style={{ padding: "14px 20px" }}>
                    <button onClick={() => del(u._id)} style={{ ...styles.btn("danger"), fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon name="trash" size={13} />Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN DOCTORS ────────────────────────────────────────────────────────────
function AdminDoctorsPage() {
  const { show } = useToast();
  const [doctors, setDoctors] = useState([]);
  const statusColor = { pending: "yellow", approved: "green", rejected: "red" };

  const load = () => {
    getAllDoctorsAdminAPI().then(res => { if (res.success) setDoctors(res.data); }).catch(() => show("Failed to load", "error"));
  };
  useEffect(load, []);

  const updateStatus = async (id, status) => {
    try { await updateDoctorStatusAPI(id, status); show(`Doctor ${status}`, "success"); load(); }
    catch { show("Update failed", "error"); }
  };

  const del = async (id) => {
    if (!window.confirm("Remove doctor?")) return;
    try { await deleteDoctorAPI(id); show("Doctor removed", "success"); load(); }
    catch { show("Delete failed", "error"); }
  };

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 24px", fontWeight: 800, fontSize: 26 }}>Manage Doctors</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {doctors.map(doc => (
          <div key={doc._id} style={{ ...styles.card, padding: 24, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${theme.teal}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: theme.teal }}>
              {doc.fullname?.charAt(3)?.toUpperCase() || "D"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>{doc.fullname}</h3>
                <span style={styles.badge(statusColor[doc.status] || "gray")}>{doc.status}</span>
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: theme.muted }}>{doc.specialization}</span>
                <span style={{ fontSize: 12, color: theme.muted }}>{doc.email}</span>
                <span style={{ fontSize: 12, color: theme.muted }}>{doc.experience} yrs • ₹{doc.fees}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {doc.status === "pending" && <>
                <button onClick={() => updateStatus(doc._id, "approved")} style={{ ...styles.btn("primary"), fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><Icon name="check" size={14} />Approve</button>
                <button onClick={() => updateStatus(doc._id, "rejected")} style={{ ...styles.btn("danger"), fontSize: 13 }}>Reject</button>
              </>}
              {doc.status === "approved" && <button onClick={() => updateStatus(doc._id, "rejected")} style={{ ...styles.btn("outline"), fontSize: 13 }}>Revoke</button>}
              <button onClick={() => del(doc._id)} style={{ ...styles.btn("ghost"), fontSize: 13 }}><Icon name="trash" size={15} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ADMIN APPOINTMENTS ───────────────────────────────────────────────────────
function AdminAppointmentsPage() {
  const { show } = useToast();
  const [appointments, setAppointments] = useState([]);
  const statusColor = { pending: "yellow", scheduled: "green", completed: "blue", cancelled: "gray" };

  useEffect(() => {
    getAllAppointmentsAdminAPI().then(res => { if (res.success) setAppointments(res.data); }).catch(() => show("Failed to load", "error"));
  }, []);

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 24px", fontWeight: 800, fontSize: 26 }}>All Appointments</h1>
      <div style={styles.card}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${theme.border}` }}>
                {["Patient", "Doctor", "Date & Time", "Fees", "Status"].map(h => (
                  <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: theme.muted, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.map(a => (
                <tr key={a._id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <td style={{ padding: "14px 20px", fontWeight: 600, fontSize: 14 }}>{a.userInfo?.name}</td>
                  <td style={{ padding: "14px 20px", fontSize: 14 }}>{a.doctorInfo?.fullname}</td>
                  <td style={{ padding: "14px 20px", fontSize: 13, color: theme.muted }}>{new Date(a.date).toLocaleDateString("en-IN")} at {a.time}</td>
                  <td style={{ padding: "14px 20px", fontSize: 13 }}>₹{a.doctorInfo?.fees}</td>
                  <td style={{ padding: "14px 20px" }}><span style={styles.badge(statusColor[a.status] || "gray")}>{a.status}</span></td>
                </tr>
              ))}
              {appointments.length === 0 && <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: theme.muted }}>No appointments</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
function ProfilePage() {
  const { user } = useAuth();
  return (
    <div style={{ padding: 32, maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ margin: "0 0 24px", fontWeight: 800, fontSize: 26 }}>My Profile</h1>
      <div style={{ ...styles.card, padding: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28, paddingBottom: 28, borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg, ${theme.teal}, ${theme.tealDark})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 28 }}>
            {user?.name?.charAt(0)}
          </div>
          <div>
            <h2 style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 22 }}>{user?.name}</h2>
            <span style={styles.badge(user?.type === "doctor" ? "blue" : user?.type === "admin" ? "purple" : "gray")}>{user?.type}</span>
          </div>
        </div>
        {[{ label: "Email", value: user?.email }, { label: "Phone", value: user?.phone || "Not provided" }].map(item => (
          <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderBottom: `1px solid ${theme.border}` }}>
            <span style={{ fontSize: 14, color: theme.muted }}>{item.label}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: theme.slate }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [authState, setAuthState] = useState(() => {
    try {
      const saved = localStorage.getItem("docspot_user");
      return saved ? { user: JSON.parse(saved), isLoggedIn: true } : { user: null, isLoggedIn: false };
    } catch { return { user: null, isLoggedIn: false }; }
  });
  const [authView, setAuthView] = useState("login");
  const [page, setPage] = useState(() => {
    const u = authState.user;
    return u?.type === "admin" ? "admin-dashboard" : u?.type === "doctor" ? "doctor-dashboard" : "home";
  });
  const [pageData, setPageData] = useState(null);

  const handleLogin = (data) => {
    // ✅ Token is stored in localStorage in LoginPage already
    setAuthState({ user: data.user, isLoggedIn: true });
    setPage(data.user.type === "admin" ? "admin-dashboard" : data.user.type === "doctor" ? "doctor-dashboard" : "home");
  };

  const handleLogout = () => {
    // ✅ Clear JWT token and user on logout
    localStorage.removeItem("docspot_token");
    localStorage.removeItem("docspot_user");
    setAuthState({ user: null, isLoggedIn: false });
    setAuthView("login");
  };

  const handleNav = (p, data = null) => { setPage(p); setPageData(data); };

  const renderPage = () => {
    switch (page) {
      case "home": return <HomePage onNav={handleNav} />;
      case "appointments": return <AppointmentsPage />;
      case "apply-doctor": return <ApplyDoctorPage />;
      case "book-appointment": return <BookAppointmentPage doctor={pageData} onNav={handleNav} />;
      case "profile": return <ProfilePage />;
      case "doctor-dashboard": case "doctor-appointments": return <DoctorDashboard onNav={handleNav} />;
      case "doctor-profile": return <DoctorProfilePage />;
      case "admin-dashboard": return <AdminDashboard />;
      case "admin-users": return <AdminUsersPage />;
      case "admin-doctors": return <AdminDoctorsPage />;
      case "admin-appointments": return <AdminAppointmentsPage />;
      default: return <HomePage onNav={handleNav} />;
    }
  };

  return (
    <AuthContext.Provider value={authState}>
      <ToastProvider>
        <style>{`
          * { box-sizing: border-box; }
          body { margin: 0; font-family: 'Inter', system-ui, sans-serif; }
          input:focus, select:focus { border-color: #0D9488 !important; box-shadow: 0 0 0 3px rgba(13,148,136,0.12); outline: none; }
          @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
          ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
        `}</style>
        {!authState.isLoggedIn
          ? (authView === "login" ? <LoginPage onLogin={handleLogin} onGoRegister={() => setAuthView("register")} /> : <RegisterPage onGoLogin={() => setAuthView("login")} />)
          : <div style={styles.page}><Navbar onNav={handleNav} currentPage={page} onLogout={handleLogout} />{renderPage()}</div>
        }
      </ToastProvider>
    </AuthContext.Provider>
  );
}
