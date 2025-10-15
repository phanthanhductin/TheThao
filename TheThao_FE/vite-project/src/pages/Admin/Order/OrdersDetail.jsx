// src/pages/Admin/Orders/OrderDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";
const HOST = API_BASE.replace("/api", "");
const VND = new Intl.NumberFormat("vi-VN");

// ====== UI helpers ======
const badgeStyle = (status) => {
  const ok = status === 1 || String(status).toLowerCase() === "completed";
  return {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    background: ok ? "#e7f9ee" : "#fff6e6",
    color: ok ? "#0a7a3f" : "#a35b00",
    fontSize: 12,
  };
};
const humanStatus = (s) => {
  if (typeof s === "string") return s;
  switch (Number(s)) {
    case 0: return "Pending";
    case 1: return "Completed";
    case 2: return "Cancelled";
    default: return "Unknown";
  }
};

// ====== data helpers ======
const n = (v) => (v == null || v === "" ? 0 : Number(v));
const first = (...xs) => xs.find((x) => x !== undefined && x !== null && x !== "") ?? null;

function pickThumb(prod, it) {
  // cố gắng lấy đủ mọi nguồn ảnh có thể
  const p = prod || {};
  const cand = first(
    it?.product_image,
    it?.image_url,
    it?.thumbnail_url,
    p.thumbnail_url,
    p.image_url,
    p.thumbnail,
    p.image
  );
  if (!cand) return null;
  // nếu đã là URL http(s) thì trả luôn
  if (/^https?:\/\//i.test(cand)) return cand;
  // còn lại: coi như file trong storage
  return `${HOST}/storage/${cand}`;
}

/** Chuẩn hoá item từ nhiều cấu trúc khác nhau về dạng {id, name, price, qty, subtotal, img} */
function normalizeItems(order) {
  const raw =
    order?.items ??
    order?.order_items ??
    order?.details ??
    order?.orderDetails ??
    order?.order_details ??
    [];

  // Một số API trả kèm product trong item
  return (Array.isArray(raw) ? raw : []).map((it, idx) => {
    const prod = it.product || it._product || null;

    const name = first(
      it.product_name,
      it.name,
      prod?.name,
      prod?.title,
      `Sản phẩm #${it.product_id ?? idx + 1}`
    );

    const qty = n(first(it.qty, it.quantity, it.qty_buy, it.amount_qty, 0));
    const price = n(
      first(
        it.price,            // giá ghi trên item
        it.price_buy,        // giá mua
        it.price_sale,       // giá sale
        it.sale_price,       // alias
        prod?.price_sale,
        prod?.sale_price,
        prod?.price          // fallback
      )
    );

    const subtotal = n(first(it.subtotal, it.amount, price * qty));
    const img = pickThumb(prod, it);

    return {
      id: it.id ?? `${idx}-${name}`,
      name,
      qty,
      price,
      subtotal,
      img,
    };
  });
}

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const token = localStorage.getItem("admin_token") || "";
        if (!token) throw new Error("Bạn chưa đăng nhập admin (thiếu admin_token).");

        const res = await fetch(`${API_BASE}/admin/orders/${id}`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        });

        const text = await res.text();
        let body = {};
        try { body = text ? JSON.parse(text) : {}; } catch {}

        if (!res.ok) {
          if (res.status === 401) throw new Error("Bạn chưa đăng nhập admin hoặc token đã hết hạn.");
          if (res.status === 403) throw new Error(body?.message || "Token không có quyền admin.");
          throw new Error(body?.message ? `HTTP ${res.status} - ${body.message}` : `HTTP ${res.status}`);
        }

        // Chuẩn hoá root (có thể trả {data: {...}} hoặc {...})
        const root = body?.data || body?.order || body;
        if (!ignore) setOrder(root);
      } catch (e) {
        if (!ignore) setErr(e.message || "Không tải được chi tiết đơn hàng.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [id]);

  const items = useMemo(() => normalizeItems(order), [order]);
  const total = useMemo(() => {
    const apiTotal = n(order?.total ?? order?.grand_total ?? order?.amount_total);
    if (apiTotal > 0) return apiTotal;
    return items.reduce((s, it) => s + n(it.subtotal), 0);
  }, [order, items]);

  if (loading) return <p>Đang tải...</p>;
  if (err) return <p style={{ color: "#d32f2f" }}>{err}</p>;
  if (!order) return <p>Không tìm thấy đơn hàng.</p>;

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h1 style={{ fontSize: 22 }}>Order #{order.id}</h1>
        <Link to="/admin/orders" style={{ border: "1px solid #ddd", padding: "6px 10px", borderRadius: 6 }}>
          ← Quay lại
        </Link>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr", marginBottom: 16 }}>
        <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
          <h3>Thông tin khách hàng</h3>
          <div>Tên: <b>{order.name || order.customer_name || "-"}</b></div>
          <div>Email: {order.email || order.customer_email || "-"}</div>
          <div>SĐT: {order.phone || order.customer_phone || "-"}</div>
          <div>Địa chỉ: {order.address || order.customer_address || "-"}</div>
          {(order.note || order.customer_note) && <div>Ghi chú: {order.note || order.customer_note}</div>}
        </div>

        <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
          <h3>Trạng thái</h3>
          <span style={badgeStyle(order.status)}>{humanStatus(order.status)}</span>
          <div style={{ marginTop: 6 }}>
            Tạo lúc: {order.created_at ? new Date(order.created_at).toLocaleString() : "-"}
          </div>
          {order.updated_at && <div>Cập nhật: {new Date(order.updated_at).toLocaleString()}</div>}
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
        <h3>Sản phẩm</h3>
        <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafafa" }}>
              <th>#</th>
              <th align="left">Sản phẩm</th>
              <th align="center">Ảnh</th>
              <th align="right">Giá</th>
              <th align="right">SL</th>
              <th align="right">Tạm tính</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((it, idx) => (
                <tr key={it.id} style={{ borderTop: "1px solid #eee" }}>
                  <td>{idx + 1}</td>
                  <td>{it.name}</td>
                  <td align="center">
                    {it.img ? (
                      <img
                        src={it.img}
                        alt={it.name}
                        style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, border: "1px solid #eee" }}
                        onError={(e) => (e.currentTarget.src = "https://placehold.co/56x56")}
                      />
                    ) : (
                      <span style={{ color: "#999" }}>—</span>
                    )}
                  </td>
                  <td align="right">₫{VND.format(n(it.price))}</td>
                  <td align="right">{n(it.qty)}</td>
                  <td align="right">₫{VND.format(n(it.subtotal))}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} align="center" style={{ color: "#666" }}>
                  Không có sản phẩm.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "1px solid #eee" }}>
              <td colSpan={5} align="right"><b>Tổng cộng</b></td>
              <td align="right"><b>₫{VND.format(total)}</b></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
