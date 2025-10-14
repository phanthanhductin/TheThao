import React, { useEffect, useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const API_BASE = "http://127.0.0.1:8000/api";
const VND = new Intl.NumberFormat("vi-VN");

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    lowStockProducts: [],
  });
  const [modal, setModal] = useState({ show: false, title: "", list: [], type: "" });

  useEffect(() => {
    loadOverview();
  }, []);

  async function loadOverview() {
    try {
      setLoading(true);
      const token =
        localStorage.getItem("admin_token") || localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/admin/dashboard/overview`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data || {});
    } catch (e) {
      console.error(e);
      setErr("Không thể tải dữ liệu dashboard.");
    } finally {
      setLoading(false);
    }
  }

  // 👉 Dữ liệu cho biểu đồ: top 10 tồn kho thấp nhất (<= 10)
  const chartData = useMemo(() => {
    const arr = Array.isArray(data.lowStockProducts) ? data.lowStockProducts : [];
    return arr
      .slice() // clone
      .sort((a, b) => a.qty - b.qty) // tăng dần theo SL
      .slice(0, 10)                  // top 10
      .map((p) => ({
        name: p.name?.length > 15 ? p.name.slice(0, 15) + "…" : p.name || `#${p.id}`,
        qty: Number(p.qty || 0),
      }));
  }, [data.lowStockProducts]);

  // 👉 Mở modal xem chi tiết
  const handleOpenModal = async (type) => {
    try {
      const token =
        localStorage.getItem("admin_token") || localStorage.getItem("token");
      let url = "";
      let title = "";

      switch (type) {
        case "products":
          url = `${API_BASE}/admin/products?per_page=30`;
          title = "📦 Danh sách sản phẩm";
          break;
        case "orders":
          url = `${API_BASE}/admin/orders?per_page=30`;
          title = "🧾 Danh sách đơn hàng";
          break;
        case "users":
          url = `${API_BASE}/admin/users?per_page=30`;
          title = "👤 Danh sách người dùng";
          break;
        case "revenue":
          url = `${API_BASE}/admin/orders?status=4&per_page=30`;
          title = "💰 Đơn hàng đã giao (doanh thu)";
          break;
        default:
          return;
      }

      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      const list = json.data || json;
      setModal({ show: true, title, list, type });
    } catch (e) {
      alert("Không tải được dữ liệu chi tiết!");
      console.error(e);
    }
  };

  if (loading) return <p style={{ textAlign: "center" }}>Đang tải dữ liệu...</p>;
  if (err) return <p style={{ color: "red", textAlign: "center" }}>{err}</p>;

  return (
    <section
      style={{
        background: "linear-gradient(135deg, #f0f9ff, #e0f7fa)",
        minHeight: "100vh",
        padding: 20,
        borderRadius: 16,
      }}
    >
      <h1
        style={{
          fontSize: 28,
          fontWeight: 800,
          marginBottom: 20,
          textAlign: "center",
          color: "#0284c7",
        }}
      >
        🧭 Dashboard
      </h1>

      {/* Các ô thống kê */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 16,
        }}
      >
        <Card
          label="Tất cả sản phẩm"
          value={data.totalProducts}
          color="#3b82f6"
          onClick={() => handleOpenModal("products")}
        />
        <Card
          label="Tổng đơn hàng"
          value={data.totalOrders}
          color="#10b981"
          onClick={() => handleOpenModal("orders")}
        />
        <Card
          label="Tổng doanh thu (đã giao)"
          value={`₫${VND.format(data.totalRevenue)}`}
          color="#22c55e"
          onClick={() => handleOpenModal("revenue")}
        />
        <Card
          label="Người dùng đã đăng ký"
          value={data.totalUsers}
          color="#9333ea"
          onClick={() => handleOpenModal("users")}
        />
      </div>

      {/* Biểu đồ tồn kho thấp */}
      <div style={{ marginTop: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
            📊 Biểu đồ Top sản phẩm tồn kho thấp
          </h2>
          <small style={{ color: "#64748b" }}>
            Hiển thị tối đa 10 sản phẩm có SL thấp nhất
          </small>
        </div>

        {chartData.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
            ✅ Không có sản phẩm nào sắp hết hàng.
          </div>
        ) : (
          <div style={{ height: 320, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(v) => [`${v}`, "SL tồn"]} />
                <Bar dataKey="qty" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Sản phẩm tồn kho thấp (thẻ) */}
      <div style={{ marginTop: 24 }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: 12,
            cursor: "pointer",
          }}
          title="Xem toàn bộ sản phẩm tồn kho thấp"
          onClick={() =>
            setModal({
              show: true,
              title: "📉 Sản phẩm tồn kho thấp (≤10)",
              list: data.lowStockProducts || [],
              type: "lowstock",
            })
          }
        >
          📋 Sản phẩm tồn kho thấp (≤ 10)
        </h2>

        {data.lowStockProducts?.length === 0 ? (
          <p>✅ Không có sản phẩm nào sắp hết hàng.</p>
        ) : (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {data.lowStockProducts.slice(0, 5).map((p) => (
              <div
                key={p.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "10px 16px",
                  minWidth: 200,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                }}
              >
                <b>{p.name}</b>
                <div style={{ fontSize: 14, color: "#475569" }}>Mã: {p.id}</div>
                <div style={{ fontSize: 14, color: "#e11d48" }}>SL: {p.qty}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal chi tiết */}
      {modal.show && (
        <DetailModal
          title={modal.title}
          data={modal.list}
          type={modal.type}
          onClose={() => setModal({ show: false, title: "", list: [], type: "" })}
        />
      )}
    </section>
  );
}

function Card({ label, value, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 20,
        textAlign: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        transition: "0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
    >
      <div style={{ color: "#64748b", fontSize: 15, marginBottom: 6, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: color || "#0f172a" }}>
        {value}
      </div>
    </div>
  );
}

// Modal hiển thị chi tiết có hình ảnh
function DetailModal({ title, data, onClose, type }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 12,
          width: "90%",
          maxWidth: 900,
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
          {title}
        </h3>

        {(!data || data.length === 0) ? (
          <p>Không có dữ liệu.</p>
        ) : (
          <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                {Object.keys(data[0]).map((key) => (
                  <th key={key} align="left" style={{ borderBottom: "1px solid #e2e8f0" }}>
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 ? "#fafafa" : "white" }}>
                  {Object.entries(item).map(([key, val], j) => (
                    <td key={j}>
                      {key === "thumbnail" || key === "thumbnail_url" ? (
                        <img
                          src={
                            String(val || "").startsWith("http")
                              ? val
                              : `http://127.0.0.1:8000/storage/${String(val || "").replace(/^public\//, "")}`
                          }
                          alt=""
                          style={{ width: 60, height: 40, objectFit: "cover", borderRadius: 6 }}
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      ) : (
                        String(val)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ textAlign: "right", marginTop: 16 }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              background: "#0f62fe",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
