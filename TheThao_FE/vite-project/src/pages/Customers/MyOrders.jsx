import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = "http://127.0.0.1:8000/api";

/* ================= Helpers ================= */
function getCustomerToken() {
  // Ưu tiên key chuẩn, fallback sang các key phổ biến để tương thích code cũ
  return (
    localStorage.getItem("mbs.customer.token") ||
    localStorage.getItem("mbs.customerToken") ||
    localStorage.getItem("token") ||
    ""
  );
}

function formatVND(n) {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);
}

function toDateTimeString(s) {
  if (!s) return "-";
  // hỗ trợ "2025-10-16T12:34:56.000000Z" hoặc "2025-10-16 12:34:56"
  return s.toString().slice(0, 19).replace("T", " ");
}

function normalizeStatus(raw) {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === "number") return raw;
  const key = String(raw).trim().toLowerCase();

  const map = {
    "0": 0, pending: 0, "chờ xác nhận": 0, "cho xac nhan": 0, "cho duyet": 0, "chờ duyệt": 0,
    "1": 1, confirmed: 1, "đã xác nhận": 1, "da xac nhan": 1, "xac nhan": 1,
    "2": 2, ready: 2, "chờ giao hàng": 2, "cho giao hang": 2, "đóng gói": 2, "dong goi": 2, "san sang": 2,
    "3": 3, shipping: 3, "đang giao": 3, "dang giao": 3, "vận chuyển": 3, "van chuyen": 3,
    "4": 4, delivered: 4, "đã giao": 4, "da giao": 4, "hoàn tất": 4, "hoan tat": 4,
    "5": 5, canceled: 5, cancelled: 5, cancel: 5, "hủy": 5, "huy": 5,
  };
  return map.hasOwnProperty(key) ? map[key] : 0;
}

function statusStyle(n) {
  const s = normalizeStatus(n);
  if (s === 0) return { bg: "#fef3c7", color: "#92400e", text: "Chờ xác nhận" };
  if (s === 1) return { bg: "#e9d5ff", color: "#6b21a8", text: "Đã xác nhận" };
  if (s === 2) return { bg: "#cffafe", color: "#155e75", text: "Chuẩn bị giao" };
  if (s === 3) return { bg: "#dbeafe", color: "#1e3a8a", text: "Đang giao" };
  if (s === 4) return { bg: "#bbf7d0", color: "#065f46", text: "Đã giao" };
  if (s === 5) return { bg: "#fee2e2", color: "#991b1b", text: "Đã hủy" };
  return { bg: "#f3f4f6", color: "#374151", text: "Chờ xử lý" };
}

async function downloadInvoice(orderId, token) {
  try {
    if (!orderId) throw new Error("Thiếu mã đơn hàng (id).");
    if (!token) throw new Error("Chưa đăng nhập.");

    const url = `${API_BASE}/orders/${orderId}/invoice.pdf`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HTTP ${res.status} - ${txt || "Tải hóa đơn thất bại"}`);
    }

    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `invoice-${orderId}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("Đã tải hóa đơn PDF");
  } catch (e) {
    console.error("[downloadInvoice] error:", e);
    toast.error(e.message || "Không thể tải hóa đơn");
  }
}

/* ================= Component ================= */
export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const token = getCustomerToken();
    if (!token) {
      setErr("⚠️ Vui lòng đăng nhập để xem đơn hàng của bạn.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`${API_BASE}/orders/mine`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || "Lỗi khi tải danh sách đơn hàng.");
        }
        const data = await res.json();
        const arr = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        setOrders(arr);
        if (!arr.length) setErr("Chưa có đơn hàng nào.");
      } catch (e) {
        console.error(e);
        setErr("Không thể tải danh sách đơn hàng.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toTrack = (o) => {
    const code = o.code || o.id;
    navigate(`/track?code=${code}`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 40,
        position: "relative",
        overflow: "hidden",
        background: "#f0fdf4", // nền xanh nhạt pastel
      }}
    >
      <AppleBackground />

      <div
        style={{
          width: "100%",
          maxWidth: 960,
          margin: "20px auto 0 auto",
          borderRadius: 20,
          background: "white",
          border: "1px solid rgba(148,163,184,.25)",
          boxShadow: "0 8px 30px rgba(0,0,0,.12)",
          position: "relative",
          zIndex: 2,
          overflow: "hidden",
        }}
      >
        {/* Header Pastel */}
        <div
          style={{
            padding: "16px 24px",
            background: "linear-gradient(to right, #bbf7d0, #fef9c3)", // xanh pastel → vàng pastel
            borderBottom: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <h1 className="text-xl font-bold text-emerald-800">🛍️ Đơn hàng của bạn</h1>
          <div className="text-sm text-emerald-900/70">
            Quản lý và theo dõi trạng thái đơn hàng dễ dàng.
          </div>
        </div>

        <div style={{ padding: 24 }}>
          {loading && <p>Đang tải danh sách đơn hàng...</p>}
          {!loading && err && <p className="text-red-600 font-medium">{err}</p>}

          {!loading && !err && orders.length > 0 && (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr className="text-left">
                    <th className="px-4 py-3">Mã đơn</th>
                    <th className="px-4 py-3">Ngày đặt</th>
                    <th className="px-4 py-3">Tổng tiền</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const st = statusStyle(o.status ?? o.status_code ?? o.statusStep);
                    return (
                      <tr
                        key={o.id || o.code}
                        className="border-t hover:bg-emerald-50/60 transition"
                      >
                        <td className="px-4 py-3 font-semibold text-emerald-800">
                          {o.code || `#${o.id}`}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {toDateTimeString(o.created_at || o.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-gray-800 font-medium">
                          {formatVND(o.total_price ?? o.total ?? 0)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            style={{
                              background: st.bg,
                              color: st.color,
                              padding: "3px 10px",
                              borderRadius: "8px",
                              fontWeight: 600,
                            }}
                          >
                            {o.status_label || st.text}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => toTrack(o)}
                            style={{
                              background: "#bbf7d0",
                              color: "#065f46",
                              padding: "6px 12px",
                              borderRadius: 8,
                              fontWeight: 600,
                              transition: "0.2s",
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.background = "#86efac")}
                            onMouseOut={(e) => (e.currentTarget.style.background = "#bbf7d0")}
                          >
                            Xem
                          </button>
                          <button
                            onClick={() => downloadInvoice(o.id, getCustomerToken())}
                            style={{
                              background: "#dbeafe",
                              color: "#1e3a8a",
                              padding: "6px 12px",
                              borderRadius: 8,
                              fontWeight: 600,
                              transition: "0.2s",
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.background = "#bfdbfe")}
                            onMouseOut={(e) => (e.currentTarget.style.background = "#dbeafe")}
                          >
                            Tải hóa đơn (PDF)
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==== Icon nền pastel táo ==== */
function AppleBackground() {
  const apples = [
    { top: "20%", left: "10%" },
    { top: "70%", left: "15%" },
    { top: "40%", left: "80%" },
    { top: "80%", left: "70%" },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
      {apples.map((pos, i) => (
        <img
          key={i}
          src="https://cdn-icons-png.flaticon.com/512/415/415682.png"
          alt="apple"
          style={{
            position: "absolute",
            top: pos.top,
            left: pos.left,
            width: 40,
            opacity: 0.08,
          }}
        />
      ))}
    </div>
  );
}
