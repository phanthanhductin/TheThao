import { useEffect, useMemo, useState } from "react";

const API = "http://127.0.0.1:8000";

export default function Coupons() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [message, setMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // {id,...} or null
  const [form, setForm] = useState(blankForm());

  function blankForm() {
    return {
      code: "",
      type: "fixed", // fixed | percent
      value: 10000,
      max_discount: "",
      min_order_total: 0,
      usage_limit: "",
      per_user_limit: 1,
      start_at: "",
      end_at: "",
      is_active: true,
    };
  }

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    }),
    []
  );

  async function safeJson(res) {
    try {
      return await res.json();
    } catch {
      const text = await res.text();
      return { __raw: text };
    }
  }

  function normalizeArray(payload) {
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload)) return payload;
    return [];
  }

  async function fetchList(keyword = "") {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(
        `${API}/api/admin/coupons${keyword ? `?q=${encodeURIComponent(keyword)}` : ""}`,
        { headers }
      );
      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.message || `Lỗi ${res.status}`);
      }

      setList(normalizeArray(data));
    } catch (e) {
      console.error(e);
      setList([]);
      setMessage(`❌ ${e.message || "Không tải được danh sách."}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(blankForm());
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      code: row.code || "",
      type: row.type || "fixed",
      value: Number(row.value ?? 0),
      max_discount: row.max_discount ?? "",
      min_order_total: Number(row.min_order_total || 0),
      usage_limit: row.usage_limit ?? "",
      per_user_limit: Number(row.per_user_limit || 1),
      start_at: row.start_at ? row.start_at.slice(0, 16) : "",
      end_at: row.end_at ? row.end_at.slice(0, 16) : "",
      is_active: !!row.is_active,
    });
    setModalOpen(true);
  }

  async function saveForm() {
    setLoading(true);
    setMessage("");
    try {
      const body = {
        ...form,
        code: String(form.code || "").toUpperCase().replace(/\s+/g, ""),
        value: Number(form.value),
        min_order_total: Number(form.min_order_total || 0),
        per_user_limit: Number(form.per_user_limit || 1),
        usage_limit: form.usage_limit === "" ? null : Number(form.usage_limit),
        max_discount:
          form.type === "percent"
            ? form.max_discount === "" ? null : Number(form.max_discount)
            : null,
      };

      const url = editing
        ? `${API}/api/admin/coupons/${editing.id}`
        : `${API}/api/admin/coupons`;
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.message || "Lưu thất bại.");
      }

      setMessage(editing ? "✅ Đã cập nhật!" : "✅ Đã tạo mã mới!");
      setModalOpen(false);
      setEditing(null);
      await fetchList(q);
    } catch (e) {
      console.error(e);
      setMessage(`❌ ${e.message || "Lỗi kết nối máy chủ."}`);
    } finally {
      setLoading(false);
    }
  }

  async function removeRow(id) {
    if (!window.confirm("Xoá mã này?")) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API}/api/admin/coupons/${id}`, {
        method: "DELETE",
        headers,
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || "Xoá thất bại.");
      setMessage("🗑️ Đã xoá!");
      await fetchList(q);
    } catch (e) {
      console.error(e);
      setMessage(`❌ ${e.message || "Lỗi kết nối."}`);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(row) {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API}/api/admin/coupons/${row.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ is_active: !row.is_active }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.message || "Đổi trạng thái thất bại.");
      await fetchList(q);
    } catch (e) {
      console.error(e);
      setMessage(`❌ ${e.message || "Lỗi kết nối."}`);
    } finally {
      setLoading(false);
    }
  }

  // ====== TẠO NHANH: GIAM10K / GIAM20K / GIAM50K ======
  function quickCreateFixed(amount) {
    const code = `GIAM${amount / 1000}K`;
    setForm({
      ...blankForm(),
      code,
      type: "fixed",
      value: amount,
      min_order_total: 0,
      usage_limit: 100,
      per_user_limit: 1,
      is_active: true,
    });
    setEditing(null);
    setModalOpen(true);
  }

  return (
    <div className="admin-screen">
      {/* Toolbar */}
      <div className="toolbar" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h2>Quản Lý Mã Giảm Giá</h2>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <input
            placeholder="Tìm mã..."
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchList(q)}
            style={{ minWidth: 240 }}
          />
          <button className="btn" onClick={() => fetchList(q)}>Tìm</button>
          <button className="btn btn-primary" onClick={openCreate}>+ Thêm mã</button>
        </div>
      </div>

      {/* Quick templates */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn" onClick={() => quickCreateFixed(10000)}>+ GIAM10K</button>
          <button className="btn" onClick={() => quickCreateFixed(20000)}>+ GIAM20K</button>
          <button className="btn" onClick={() => quickCreateFixed(50000)}>+ GIAM50K</button>
          <button
            className="btn"
            onClick={() => {
              setForm({
                ...blankForm(),
                code: "GIAM10",
                type: "percent",
                value: 10,
                max_discount: 50000,
                min_order_total: 100000,
                usage_limit: 100,
              });
              setEditing(null);
              setModalOpen(true);
            }}
          >
            + GIAM10% (trần 50K)
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {message && <div style={{ marginBottom: 10, color: "#c62828" }}>{message}</div>}

        <div style={{ overflowX: "auto" }}>
          <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Code</th>
                <th>Loại</th>
                <th>Giá trị</th>
                <th>Tối thiểu đơn</th>
                <th>Trần (percent)</th>
                <th>Dùng/Limit</th>
                <th>Thời gian</th>
                <th>TT</th>
                <th style={{ width: 160 }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9}>Đang tải...</td></tr>
              ) : !Array.isArray(list) || list.length === 0 ? (
                <tr><td colSpan={9}>Chưa có mã</td></tr>
              ) : (
                list.map((r) => (
                  <tr key={r.id}>
                    <td style={{ textAlign: "left", fontWeight: 600 }}>{r.code}</td>
                    <td>{r.type}</td>
                    <td>{r.type === "fixed"
                        ? Number(r.value).toLocaleString("vi-VN") + " đ"
                        : Number(r.value) + " %"}</td>
                    <td>{Number(r.min_order_total || 0).toLocaleString("vi-VN")} đ</td>
                    <td>{r.type === "percent"
                          ? (r.max_discount ? Number(r.max_discount).toLocaleString("vi-VN") + " đ" : "—")
                          : "—"}</td>
                    <td>{(r.used_count || 0)}/{r.usage_limit ?? "∞"}</td>
                    <td style={{ fontSize: 12 }}>
                      {r.start_at ? new Date(r.start_at).toLocaleString() : "—"} <br />
                      {r.end_at ? "→ " + new Date(r.end_at).toLocaleString() : ""}
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: r.is_active ? "rgba(16,185,129,.15)" : "rgba(239,68,68,.12)",
                          color: r.is_active ? "#10b981" : "#ef4444",
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        {r.is_active ? "ON" : "OFF"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-green" onClick={() => openEdit(r)}>Sửa</button>
                        <button className="btn" onClick={() => toggleActive(r)}>
                          {r.is_active ? "Tắt" : "Bật"}
                        </button>
                        <button className="btn btn-danger" onClick={() => removeRow(r.id)}>Xoá</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.4)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div
            style={{
              width: 720, maxWidth: "95%", background: "#fff",
              borderRadius: 12, padding: 16, boxShadow: "0 10px 30px rgba(0,0,0,.2)"
            }}
          >
            <h3 style={{ marginBottom: 12 }}>
              {editing ? "Sửa mã giảm giá" : "Thêm mã giảm giá"}
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label>Mã (CODE)</label>
                <input
                  className="input"
                  value={form.code}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, code: e.target.value.toUpperCase() }))
                  }
                  placeholder="GIAM10K / GIAM20K / SUMMER10 ..."
                />
              </div>

              <div>
                <label>Loại</label>
                <select
                  className="input"
                  value={form.type}
                  onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))}
                >
                  <option value="fixed">Cố định (đ)</option>
                  <option value="percent">Phần trăm (%)</option>
                </select>
              </div>

              <div>
                <label>Giá trị</label>
                <input
                  type="number"
                  className="input"
                  value={form.value}
                  onChange={(e) => setForm((s) => ({ ...s, value: Number(e.target.value) }))}
                  placeholder="10 hoặc 50000"
                />
              </div>

              <div>
                <label>Trần giảm (cho %)</label>
                <input
                  type="number"
                  className="input"
                  value={form.max_discount}
                  onChange={(e) => setForm((s) => ({ ...s, max_discount: e.target.value }))}
                  placeholder="VD 50000"
                  disabled={form.type !== "percent"}
                />
              </div>

              <div>
                <label>Giá trị tối thiểu đơn</label>
                <input
                  type="number"
                  className="input"
                  value={form.min_order_total}
                  onChange={(e) => setForm((s) => ({ ...s, min_order_total: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>

              <div>
                <label>Giới hạn tổng lượt</label>
                <input
                  type="number"
                  className="input"
                  value={form.usage_limit}
                  onChange={(e) => setForm((s) => ({ ...s, usage_limit: e.target.value }))}
                  placeholder="để trống = không giới hạn"
                />
              </div>

              <div>
                <label>Giới hạn mỗi user</label>
                <input
                  type="number"
                  className="input"
                  value={form.per_user_limit}
                  onChange={(e) => setForm((s) => ({ ...s, per_user_limit: Number(e.target.value) }))}
                  placeholder="1"
                />
              </div>

              <div>
                <label>Bắt đầu</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={form.start_at}
                  onChange={(e) => setForm((s) => ({ ...s, start_at: e.target.value }))}
                />
              </div>

              <div>
                <label>Kết thúc</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={form.end_at}
                  onChange={(e) => setForm((s) => ({ ...s, end_at: e.target.value }))}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  id="is_active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.checked }))}
                />
                <label htmlFor="is_active">Kích hoạt</label>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button className="btn" onClick={() => setModalOpen(false)}>Đóng</button>
              <button className="btn btn-primary" onClick={saveForm} disabled={loading}>
                {editing ? "Lưu thay đổi" : "Tạo mã"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
