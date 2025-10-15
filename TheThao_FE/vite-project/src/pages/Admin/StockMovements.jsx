import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";
const PLACEHOLDER = "https://placehold.co/60x60?text=No+Img";

/* ===== UI bits ===== */
function TypeBadge({ type }) {
  const map = {
    import: { text: "Nhập", cls: "type-import" },
    export: { text: "Xuất", cls: "type-export" },
    return: { text: "Trả về", cls: "type-return" },
    adjust: { text: "Điều chỉnh", cls: "type-adjust" },
  };
  const meta = map[type] || { text: type || "—", cls: "type-other" };
  return <span className={`type-badge ${meta.cls}`}>{meta.text}</span>;
}

function QtyBadge({ qty_change = 0, qty = 0 }) {
  const up = Number(qty_change) >= 0;
  return <span className={`qty-badge ${up ? "qty-up" : "qty-down"}`}>{qty}</span>;
}

const fmtDate = (v) => {
  try { return new Date(v).toLocaleString("vi-VN"); } catch { return v || ""; }
};

function pickPaginator(payload) {
  const p =
    payload &&
    payload.data &&
    typeof payload.data === "object" &&
    Array.isArray(payload.data.data)
      ? payload.data
      : payload || {};
  const items = Array.isArray(p.data) ? p.data : [];
  return {
    items,
    meta: {
      current_page: Number(p.current_page ?? 1),
      last_page: Number(p.last_page ?? 1),
      per_page: Number(p.per_page ?? (items.length || 10)), // 👈 fallback 10
      total: Number(p.total ?? items.length),
    },
  };
}

/* ===== Main Component ===== */
export default function StockMovements() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,  // 👈 hiển thị
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10); // 👈 gửi API

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ type: "import", qty: "", note: "" });

  /* ==== Load data ==== */
  async function load() {
    const token = localStorage.getItem("admin_token");
    try {
      setLoading(true);
      setErr("");
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (type) params.set("type", type);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      params.set("page", String(page));
      params.set("per_page", String(perPage)); // 👈 10/trang

      const res = await fetch(
        `${API_BASE}/admin/stock-movements?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );

      const ct = res.headers.get("content-type") || "";
      const payload = ct.includes("application/json") ? await res.json() : await res.text();
      if (!res.ok) throw new Error(typeof payload === "string" ? payload : (payload?.message || "Lỗi tải dữ liệu"));

      const picked = pickPaginator(payload);
      setItems(picked.items);
      setMeta(picked.meta);
    } catch (e) {
      setErr(e.message || "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, perPage]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, 300);
    return () => clearTimeout(t);
  }, [q, type, from, to]);

  // Nếu sau này đổi perPage, tự quay về trang 1
  useEffect(() => { setPage(1); }, [perPage]);

  const filtered = useMemo(() => {
    if (!q && !type) return items;
    const kw = q.trim().toLowerCase();
    return items.filter((x) => {
      const okKw =
        !kw ||
        x.product_name?.toLowerCase().includes(kw) ||
        (x.type ?? x.last_movement_type ?? "").toLowerCase().includes(kw);
      const okType = !type || (x.type ?? x.last_movement_type) === type;
      return okKw && okType;
    });
  }, [items, q, type]);

  /* ==== Modal handlers ==== */
  function openModal(item) {
    setSelected(item);
    setForm({ type: "import", qty: "", note: "" });
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!selected) return;
    const token = localStorage.getItem("admin_token");
    try {
      const payload = { product_id: selected.product_id, type: form.type, note: form.note };
      if (form.type === "adjust") payload.qty_change = Number(form.qty);
      else payload.qty = Number(form.qty);

      const res = await fetch(`${API_BASE}/admin/stock-movements`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await res.json() : await res.text();
      if (!res.ok) throw new Error(typeof data === "string" ? data : (data?.message || "Lỗi thao tác kho"));

      alert("✅ Thao tác kho thành công!");

      // Cập nhật UI tại chỗ
      setItems((prev) =>
        prev.map((it) =>
          it.product_id === selected.product_id
            ? {
                ...it,
                qty: form.type === "export" ? it.qty - Number(form.qty) : it.qty + Number(form.qty),
                type: form.type,
                qty_change: form.type === "export" ? -Number(form.qty) : Number(form.qty),
                note: form.note || it.note,
                created_at: new Date().toISOString(),
                last_movement_type: form.type,
                last_movement_qty: Math.abs(Number(form.qty)),
                last_movement_note: form.note || it.last_movement_note,
                last_movement_date: new Date().toISOString(),
              }
            : it
        )
      );

      setShowModal(false);
    } catch (e) {
      alert("❌ " + e.message);
    }
  }

  // ===== Pagination helpers =====
  const pagesToShow = useMemo(() => {
    const total = Number(meta.last_page || 1);
    const cur = Number(meta.current_page || 1);
    if (total <= 10) return Array.from({ length: total }, (_, i) => i + 1);

    const out = [];
    const start = Math.max(1, cur - 2);
    const end = Math.min(total, cur + 2);

    out.push(1);
    if (start > 2) out.push("…");
    for (let i = start; i <= end; i++) out.push(i);
    if (end < total - 1) out.push("…");
    if (total > 1) out.push(total);
    return out;
  }, [meta]);

  return (
    <div className="stock-page">
      <style>{`
        .stock-page { font-family: 'Segoe UI', sans-serif; color:#0f172a; padding: 20px; }
        .topbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
        .topbar-left { display:flex; gap:8px; align-items:center; }
        .btn-link { border:1px solid #cbd5e1; background:white; padding:6px 10px; border-radius:8px; cursor:pointer; font-size:13px; }
        .btn-link:hover { background:#f1f5f9; }
        .filters { display:flex; flex-wrap:wrap; gap:8px; margin-bottom: 14px; }
        .filters input, .filters select, .filters button {
          padding: 6px 8px; border:1px solid #cbd5e1; border-radius: 8px; font-size:13px; background: white;
        }
        .filters button { background:#0ea5e9; color:white; border:none; }
        .filters button:hover { background:#0284c7; }

        table.stock-table { width:100%; border-collapse: collapse; background:white; }
        .stock-table th, .stock-table td { border:1px solid #e2e8f0; padding:8px; text-align:center; font-size:13px; }
        .stock-table th { background:#f8fafc; font-weight:700; }

        .product-info { display:flex; align-items:center; gap:10px; justify-content:flex-start; }
        .product-info img { width:60px; height:60px; border-radius:8px; object-fit:cover; border:1px solid #e2e8f0; }

        .type-badge { display:inline-block; padding:3px 8px; border-radius:12px; font-size:12px; font-weight:600; border:1px solid transparent; }
        .type-import { background:#e7fbe9; color:#166534; border-color:#b6e3b9; }
        .type-export { background:#fde8e8; color:#991b1b; border-color:#f2c2c2; }
        .type-return { background:#fff4da; color:#b45309; border-color:#f5d58a; }
        .type-adjust { background:#e0f2fe; color:#1e40af; border-color:#bfdbfe; }

        .qty-badge { display:inline-block; min-width:40px; padding:3px 8px; border-radius:10px; border:1px solid #e2e8f0; }
        .qty-up { background:#eefdf3; color:#166534; }
        .qty-down { background:#fff1f2; color:#9f1239; }

        .action-btn { background:#3b82f6; color:white; border:none; padding:6px 10px; border-radius:8px; cursor:pointer; font-size:13px; }
        .action-btn:hover { background:#2563eb; }

        .pager { display:flex; gap:6px; align-items:center; justify-content:flex-end; margin-top:10px; }
        .pager button { padding:6px 10px; border:1px solid #cbd5e1; background:white; border-radius:8px; cursor:pointer; }
        .pager button[disabled] { opacity:.5; cursor:not-allowed; }
        .pager .page-btn.active { background:#3b82f6; color:white; border-color:#3b82f6; }
      `}</style>

      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-left">
          <button className="btn-link" onClick={() => navigate(-1)}>← Quay lại</button>
          <button className="btn-link" onClick={() => navigate("/admin")}>🏠 Trang chủ</button>
        </div>
        <h1 style={{margin:0}}>Quản lý nhập – xuất kho</h1>
        <div style={{width:120}} />
      </div>

      {/* Filters */}
      <div className="filters">
        <input type="text" placeholder="Tìm tên/ID..." value={q} onChange={(e)=>setQ(e.target.value)} />
        <select value={type} onChange={(e)=>setType(e.target.value)}>
          <option value="">Tất cả loại</option>
          <option value="import">Nhập</option>
          <option value="export">Xuất</option>
          <option value="return">Trả về</option>
          <option value="adjust">Điều chỉnh</option>
        </select>
        <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} />
        <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} />
        <button onClick={load}>Làm mới</button>
      </div>

      {/* Table */}
      <table className="stock-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Sản phẩm</th>
            <th>Loại</th>
            <th>Số lượng</th>
            <th>Ngày</th>
            <th>Ghi chú</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={7}>Đang tải…</td></tr>}
          {!loading && err && <tr><td colSpan={7} style={{color:'#b91c1c'}}>Lỗi: {err}</td></tr>}
          {!loading && !err && filtered.length === 0 && <tr><td colSpan={7}>Không có dữ liệu</td></tr>}

          {!loading && !err && filtered.map((x,i)=> {
            const tType = x.type ?? x.last_movement_type ?? "";
            const tQty  = (x.qty_change ?? x.last_movement_qty ?? 0);
            const tDate = x.created_at || x.last_movement_date || "";
            const tNote = (x.note ?? x.last_movement_note ?? "—").toString();

            return (
              <tr key={`${x.product_id}-${i}`}>
                <td>{(meta.current_page-1)*meta.per_page+(i+1)}</td>
                <td style={{textAlign:'left'}}>
                  <div className="product-info">
                    <img src={x.thumbnail_url || PLACEHOLDER} onError={(e)=>{e.currentTarget.src=PLACEHOLDER;}} alt="" />
                    <div>
                      <div style={{fontWeight:600}}>{x.product_name}</div>
                      <small>ID: {x.product_id}</small>
                    </div>
                  </div>
                </td>
                <td><TypeBadge type={tType} /></td>
                <td><QtyBadge qty_change={tQty} qty={Math.abs(Number(tQty))} /></td>
                <td>{fmtDate(tDate)}</td>
                <td style={{textAlign:'left'}}>{tNote.trim() || "—"}</td>
                <td><button className="action-btn" onClick={()=>openModal(x)}>Chỉnh</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pager">
        <span style={{marginRight:'auto'}}>Tổng: {meta.total} mục • {meta.per_page} mục/trang</span>

        <button onClick={()=>setPage(1)} disabled={meta.current_page <= 1}>«</button>
        <button onClick={()=>setPage(p=>Math.max(1, p-1))} disabled={meta.current_page <= 1}>‹</button>

        {(() => {
          const total = Number(meta.last_page || 1);
          const cur = Number(meta.current_page || 1);
          const nums = [];
          const start = Math.max(1, cur - 2);
          const end = Math.min(total, cur + 2);
          nums.push(1);
          if (start > 2) nums.push("…");
          for (let i = start; i <= end; i++) nums.push(i);
          if (end < total - 1) nums.push("…");
          if (total > 1) nums.push(total);

          return nums.map((p, idx) =>
            p === "…" ? (
              <span key={`dots-${idx}`}>…</span>
            ) : (
              <button
                key={p}
                className={`page-btn ${p === meta.current_page ? "active" : ""}`}
                onClick={()=>setPage(p)}
                disabled={p === meta.current_page}
              >
                {p}
              </button>
            )
          );
        })()}

        <button onClick={()=>setPage(p=>Math.min(meta.last_page, p+1))} disabled={meta.current_page >= meta.last_page}>›</button>
        <button onClick={()=>setPage(meta.last_page)} disabled={meta.current_page >= meta.last_page}>»</button>
      </div>

      {/* Modal */}
      {showModal && selected && (
        <div className="modal-bg" onClick={()=>setShowModal(false)}>
          <div className="modal-box" onClick={(e)=>e.stopPropagation()}>
            <h3>Thao tác kho</h3>
            <p><b>{selected.product_name}</b> (ID: {selected.product_id})</p>
            <div style={{marginTop:8}}>
              <label>Loại phiếu</label>
              <select value={form.type} onChange={(e)=>setForm({...form, type:e.target.value})}>
                <option value="import">Nhập</option>
                <option value="export">Xuất</option>
                <option value="adjust">Điều chỉnh</option>
              </select>
            </div>
            <div>
              <label>Số lượng</label>
              <input type="number" value={form.qty} onChange={(e)=>setForm({...form, qty:e.target.value})}/>
            </div>
            <div>
              <label>Ghi chú</label>
              <textarea rows={2} value={form.note} onChange={(e)=>setForm({...form, note:e.target.value})}/>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSubmit}>Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
