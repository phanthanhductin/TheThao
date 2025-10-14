// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// const API_BASE = "http://127.0.0.1:8000/api";

// export default function TrashProducts() {
//   const [items, setItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState("");
//   const navigate = useNavigate();

//   useEffect(() => {
//     const ac = new AbortController();
//     const token = localStorage.getItem("admin_token");

//     (async () => {
//       try {
//         setLoading(true);
//         setErr("");
//         const res = await fetch(`${API_BASE}/admin/products/trash`, {
//           signal: ac.signal,
//           headers: {
//             Accept: "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//         });
//         const data = await res.json();
//         setItems(Array.isArray(data.data) ? data.data : []);
//       } catch {
//         setErr("Không tải được thùng rác.");
//       } finally {
//         setLoading(false);
//       }
//     })();

//     return () => ac.abort();
//   }, []);

//   const restore = async (id) => {
//     const token = localStorage.getItem("admin_token");
//     if (!window.confirm("Khôi phục sản phẩm này?")) return;
//     const res = await fetch(`${API_BASE}/admin/products/${id}/restore`, {
//       method: "POST",
//       headers: {
//         Accept: "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//     });
//     if (res.ok) {
//       setItems((prev) => prev.filter((x) => x.id !== id));
//       alert("✅ Đã khôi phục sản phẩm!");
//     } else alert("❌ Lỗi khi khôi phục");
//   };

//   const forceDelete = async (id) => {
//     const token = localStorage.getItem("admin_token");
//     if (!window.confirm("Xóa vĩnh viễn sản phẩm này?")) return;
//     const res = await fetch(`${API_BASE}/admin/products/${id}/force`, {
//       method: "DELETE",
//       headers: {
//         Accept: "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//     });
//     if (res.ok) {
//       setItems((prev) => prev.filter((x) => x.id !== id));
//       alert("🗑 Đã xoá vĩnh viễn!");
//     } else alert("❌ Lỗi xoá vĩnh viễn");
//   };

//   return (
//     <section style={{ padding: 20 }}>
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//         <h1 style={{ fontSize: 24 }}>🗂 Thùng rác sản phẩm</h1>
//         <button
//           onClick={() => navigate("/admin/products")}
//           style={{
//             padding: "8px 12px",
//             borderRadius: 8,
//             border: "1px solid #0f62fe",
//             background: "#0f62fe",
//             color: "#fff",
//             cursor: "pointer",
//           }}
//         >
//           ← Quay lại danh sách
//         </button>
//       </div>

//       {loading && <p>Đang tải...</p>}
//       {err && <p style={{ color: "red" }}>{err}</p>}

//       {!loading && (
//         <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse", background: "#fff", marginTop: 10 }}>
//           <thead>
//             <tr style={{ background: "#fafafa" }}>
//               <th>ID</th>
//               <th>Tên</th>
//               <th>Slug</th>
//               <th>Ảnh</th>
//               <th align="center">Hành động</th>
//             </tr>
//           </thead>
//           <tbody>
//             {items.map((p) => (
//               <tr key={p.id} style={{ borderTop: "1px solid #eee" }}>
//                 <td>{p.id}</td>
//                 <td>{p.name}</td>
//                 <td>{p.slug}</td>
//                 <td align="center">
//                   <img
//                     src={p.thumbnail_url}
//                     alt={p.name}
//                     style={{ width: 60, height: 40, objectFit: "cover", borderRadius: 4 }}
//                     onError={(e) => (e.currentTarget.src = "https://placehold.co/60x40?text=No+Img")}
//                   />
//                 </td>
//                 <td align="center">
//                   <button
//                     onClick={() => restore(p.id)}
//                     style={{
//                       padding: "4px 10px",
//                       marginRight: 6,
//                       background: "#15803d",
//                       color: "#fff",
//                       border: 0,
//                       borderRadius: 6,
//                       cursor: "pointer",
//                     }}
//                   >
//                     Khôi phục
//                   </button>
//                   <button
//                     onClick={() => forceDelete(p.id)}
//                     style={{
//                       padding: "4px 10px",
//                       background: "#b91c1c",
//                       color: "#fff",
//                       border: 0,
//                       borderRadius: 6,
//                       cursor: "pointer",
//                     }}
//                   >
//                     Xoá vĩnh viễn
//                   </button>
//                 </td>
//               </tr>
//             ))}
//             {!items.length && (
//               <tr>
//                 <td colSpan={5} align="center" style={{ padding: 20, color: "#777" }}>
//                   Thùng rác trống
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       )}
//     </section>
//   );
// }


import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";

export default function TrashProducts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState(() => new Set()); // lưu các id đã chọn
  const [busy, setBusy] = useState(false); // chặn bấm khi đang thao tác hàng loạt
  const navigate = useNavigate();

  const adminToken = () => localStorage.getItem("admin_token");

  // ===== Load danh sách trong thùng rác =====
  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`${API_BASE}/admin/products/trash`, {
          signal: ac.signal,
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${adminToken()}`,
          },
        });
        const data = await res.json();
        const list = Array.isArray(data?.data) ? data.data : [];
        setItems(list);
        setSelected(new Set()); // reset các chọn cũ
      } catch {
        setErr("Không tải được thùng rác.");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  // ====== Helpers chọn ======
  const allIds = useMemo(() => items.map((x) => x.id), [items]);
  const isAllChecked = selected.size > 0 && selected.size === items.length;
  const isIndeterminate = selected.size > 0 && selected.size < items.length;

  const toggleOne = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === items.length) return new Set(); // bỏ chọn hết
      return new Set(allIds); // chọn tất cả
    });
  }, [items.length, allIds]);

  // ====== API actions đơn lẻ ======
  const restore = async (id) => {
    const token = adminToken();
    if (!window.confirm("Khôi phục sản phẩm này?")) return;
    const res = await fetch(`${API_BASE}/admin/products/${id}/restore`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      setItems((prev) => prev.filter((x) => x.id !== id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      alert("✅ Đã khôi phục sản phẩm!");
    } else alert("❌ Lỗi khi khôi phục");
  };

  const forceDelete = async (id) => {
    const token = adminToken();
    if (!window.confirm("Xóa vĩnh viễn sản phẩm này?")) return;
    const res = await fetch(`${API_BASE}/admin/products/${id}/force`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      setItems((prev) => prev.filter((x) => x.id !== id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      alert("🗑 Đã xoá vĩnh viễn!");
    } else alert("❌ Lỗi xoá vĩnh viễn");
  };

  // ====== Hành động hàng loạt ======
  const doBulk = async (type) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    const confirmMsg =
      type === "restore"
        ? `Khôi phục ${ids.length} sản phẩm đã chọn?`
        : `Xoá vĩnh viễn ${ids.length} sản phẩm đã chọn?`;
    if (!window.confirm(confirmMsg)) return;

    setBusy(true);
    const token = adminToken();

    // Nếu chưa có endpoint bulk, gọi tuần tự từng id
    const tasks = ids.map((id) =>
      fetch(
        type === "restore"
          ? `${API_BASE}/admin/products/${id}/restore`
          : `${API_BASE}/admin/products/${id}/force`,
        {
          method: type === "restore" ? "POST" : "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      ).then((r) => ({ id, ok: r.ok }))
       .catch(() => ({ id, ok: false }))
    );

    const results = await Promise.allSettled(tasks);
    let okCount = 0;
    let failIds = [];
    let okIds = [];

    results.forEach((r) => {
      if (r.status === "fulfilled" && r.value.ok) {
        okCount++;
        okIds.push(r.value.id);
      } else if (r.status === "fulfilled") {
        failIds.push(r.value.id);
      } else {
        // rejected
        // r.reason chứa promise bị lỗi (đã catch ở trên nên ít khi vào đây)
      }
    });

    // Cập nhật UI: bỏ các item đã ok
    if (okIds.length) {
      setItems((prev) => prev.filter((x) => !okIds.includes(x.id)));
      setSelected((prev) => {
        const next = new Set(prev);
        okIds.forEach((id) => next.delete(id));
        return next;
      });
    }

    setBusy(false);
    if (okCount && !failIds.length) {
      alert(
        type === "restore"
          ? `✅ Đã khôi phục ${okCount} sản phẩm.`
          : `🗑 Đã xoá vĩnh viễn ${okCount} sản phẩm.`
      );
    } else if (okCount && failIds.length) {
      alert(
        `${type === "restore" ? "⚠️" : "⚠️"} Thành công ${okCount}, thất bại ${
          failIds.length
        }: ${failIds.join(", ")}`
      );
    } else {
      alert("❌ Không thao tác được sản phẩm nào.");
    }
  };

  return (
    <section style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>🗂 Thùng rác sản phẩm</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => doBulk("restore")}
            disabled={busy || selected.size === 0}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: 0,
              background: selected.size === 0 ? "#9ca3af" : "#15803d",
              color: "#fff",
              cursor: selected.size === 0 ? "not-allowed" : "pointer",
            }}
            title="Khôi phục các sản phẩm đã chọn"
          >
            ↩ Khôi phục đã chọn ({selected.size})
          </button>
          <button
            onClick={() => doBulk("force")}
            disabled={busy || selected.size === 0}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: 0,
              background: selected.size === 0 ? "#9ca3af" : "#b91c1c",
              color: "#fff",
              cursor: selected.size === 0 ? "not-allowed" : "pointer",
            }}
            title="Xoá vĩnh viễn các sản phẩm đã chọn"
          >
            🗑 Xoá vĩnh viễn đã chọn ({selected.size})
          </button>
          <button
            onClick={() => navigate("/admin/products")}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #0f62fe",
              background: "#0f62fe",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            ← Quay lại danh sách
          </button>
        </div>
      </div>

      {loading && <p>Đang tải...</p>}
      {err && <p style={{ color: "red" }}>{err}</p>}

      {!loading && (
        <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse", background: "#fff", marginTop: 10 }}>
          <thead>
            <tr style={{ background: "#fafafa" }}>
              <th style={{ width: 36, textAlign: "center" }}>
                {/* Checkbox chọn tất cả với trạng thái indeterminate */}
                <input
                  type="checkbox"
                  checked={isAllChecked}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={toggleAll}
                  aria-label="Chọn tất cả"
                />
              </th>
              <th>ID</th>
              <th>Tên</th>
              <th>Slug</th>
              <th>Ảnh</th>
              <th align="center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => {
              const checked = selected.has(p.id);
              return (
                <tr key={p.id} style={{ borderTop: "1px solid #eee", background: checked ? "#f0f9ff" : "transparent" }}>
                  <td align="center">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOne(p.id)}
                      aria-label={`Chọn sản phẩm ${p.name}`}
                    />
                  </td>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.slug}</td>
                  <td align="center">
                    <img
                      src={p.thumbnail_url}
                      alt={p.name}
                      style={{ width: 60, height: 40, objectFit: "cover", borderRadius: 4 }}
                      onError={(e) => (e.currentTarget.src = "https://placehold.co/60x40?text=No+Img")}
                    />
                  </td>
                  <td align="center">
                    <button
                      onClick={() => restore(p.id)}
                      disabled={busy}
                      style={{
                        padding: "4px 10px",
                        marginRight: 6,
                        background: "#15803d",
                        color: "#fff",
                        border: 0,
                        borderRadius: 6,
                        cursor: busy ? "not-allowed" : "pointer",
                      }}
                    >
                      Khôi phục
                    </button>
                    <button
                      onClick={() => forceDelete(p.id)}
                      disabled={busy}
                      style={{
                        padding: "4px 10px",
                        background: "#b91c1c",
                        color: "#fff",
                        border: 0,
                        borderRadius: 6,
                        cursor: busy ? "not-allowed" : "pointer",
                      }}
                    >
                      Xoá vĩnh viễn
                    </button>
                  </td>
                </tr>
              );
            })}
            {!items.length && (
              <tr>
                <td colSpan={6} align="center" style={{ padding: 20, color: "#777" }}>
                  Thùng rác trống
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
