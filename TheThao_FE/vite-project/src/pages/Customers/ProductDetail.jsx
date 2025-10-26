



// import { useEffect, useMemo, useState } from "react";
// import { useParams, Link, useNavigate, useLocation } from "react-router-dom";

// const API = "http://127.0.0.1:8000/api";
// const ALT = "http://127.0.0.1:8000";
// const PLACEHOLDER = "https://placehold.co/400x300?text=No+Image";
// const VND = new Intl.NumberFormat("vi-VN");

// export default function ProductDetail({ addToCart }) {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const token = localStorage.getItem("token");

//   const [product, setProduct] = useState(null);
//   const [related, setRelated] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState("");

//   const [coupons, setCoupons] = useState([]);
//   const [savingCode, setSavingCode] = useState("");

//   const [reviews, setReviews] = useState([]);
//   const [canReview, setCanReview] = useState(false);
//   const [showForm, setShowForm] = useState(false);
//   const [rev, setRev] = useState({ rating: 5, content: "" });

//   const [qty, setQty] = useState(1);

//   const [toast, setToast] = useState(null);
//   const showToast = (msg, ok = true) => {
//     setToast({ msg, ok });
//     setTimeout(() => setToast(null), 1800);
//   };

//   const getThumb = (p) =>
//     p?.thumbnail_url || p?.thumbnail || p?.image_url || PLACEHOLDER;

//   const priceRoot = (p) => Number(p?.price_root ?? p?.price ?? 0);
//   const priceSale = (p) => Number(p?.price_sale ?? 0);
//   const effectivePrice = (p) =>
//     priceSale(p) > 0 && priceSale(p) < priceRoot(p) ? priceSale(p) : priceRoot(p);

//   const discount = useMemo(() => {
//     const r = priceRoot(product);
//     const s = priceSale(product);
//     if (r > 0 && s > 0 && s < r) {
//       return Math.round(((r - s) / r) * 100);
//     }
//     return 0;
//   }, [product]);

//   // ✅ Tồn kho: lấy từ API (ProductController@show đã trả qty)
//   const stock = Number(product?.qty ?? 0);
//   const outOfStock = stock <= 0;

//   const pushToCart = (item) => {
//     if (outOfStock) {
//       showToast("Sản phẩm đã hết hàng.", false);
//       return;
//     }
//     if (item.qty > stock) {
//       showToast(`Chỉ còn ${stock} sản phẩm trong kho.`, false);
//       return;
//     }

//     if (addToCart) {
//       addToCart(item);
//       showToast("🛒 Đã thêm vào giỏ!", true);
//       return;
//     }
//     const load = () => {
//       try {
//         return JSON.parse(localStorage.getItem("cart") || "[]");
//       } catch {
//         return [];
//       }
//     };
//     const save = (v) => localStorage.setItem("cart", JSON.stringify(v));
//     const cart = load();
//     const idx = cart.findIndex((x) => x.id === item.id);
//     if (idx >= 0) cart[idx].qty = Math.min(stock, cart[idx].qty + item.qty);
//     else cart.push(item);
//     save(cart);
//     showToast("🛒 Đã thêm vào giỏ!", true);
//     navigate("/cart");
//   };

//   // ---------- Fetch product + related ----------
//   useEffect(() => {
//     const ac = new AbortController();
//     (async () => {
//       try {
//         setLoading(true);
//         setErr("");

//         let p = null;
//         try {
//           const r = await fetch(`${API}/products/${id}`, { signal: ac.signal });
//           if (r.ok) {
//             const d = await r.json();
//             p = d.data || d.product || d;
//           }
//         } catch {}

//         if (!p) {
//           const r2 = await fetch(`${ALT}/products/${id}`, { signal: ac.signal });
//           if (!r2.ok) throw new Error(`HTTP ${r2.status}`);
//           const d2 = await r2.json();
//           p = d2.data || d2.product || d2;
//         }

//         setProduct(p);

//         // Related theo category
//         if (p?.category_id) {
//           try {
//             const rc = await fetch(`${API}/categories/${p.category_id}/products`, {
//               signal: ac.signal,
//             });
//             if (rc.ok) {
//               const dd = await rc.json();
//               const list = Array.isArray(dd) ? dd : dd.data ?? [];
//               setRelated(list.filter(it => it.id !== Number(id)).slice(0, 8));
//             } else {
//               setRelated([]);
//             }
//           } catch {
//             setRelated([]);
//           }
//         } else {
//           setRelated([]);
//         }
//       } catch (e) {
//         console.error(e);
//         setErr("Không tải được sản phẩm.");
//       } finally {
//         setLoading(false);
//       }
//     })();
//     return () => ac.abort();
//   }, [id]);

//   // ---------- Fetch coupons ----------
//   useEffect(() => {
//     if (!id) return;
//     const ac = new AbortController();
//     (async () => {
//       try {
//         const r = await fetch(`${API}/coupons?product_id=${id}`, {
//           signal: ac.signal,
//         });
//         if (!r.ok) {
//           setCoupons([]);
//           return;
//         }
//         const data = await r.json();
//         setCoupons(Array.isArray(data) ? data : data.data ?? []);
//       } catch {
//         setCoupons([]);
//       }
//     })();
//     return () => ac.abort();
//   }, [id]);

//   // ---------- Reviews ----------
//   useEffect(() => {
//     const ac = new AbortController();
//     fetch(`${API}/products/${id}/reviews`, { signal: ac.signal })
//       .then((r) => r.json())
//       .then((d) => setReviews(Array.isArray(d) ? d : d.data ?? []))
//       .catch(() => setReviews([]));

//     if (token) {
//       fetch(`${API}/products/${id}/can-review`, {
//         headers: { Authorization: `Bearer ${token}` },
//         signal: ac.signal,
//       })
//         .then((r) => (r.ok ? r.json() : Promise.reject()))
//         .then((d) => setCanReview(!!(d.can || d.allowed || d === true)))
//         .catch(() => setCanReview(false));
//     } else setCanReview(false);

//     if (new URLSearchParams(location.search).get("review")) setShowForm(true);
//     return () => ac.abort();
//   }, [id, token, location.search]);

//   const submitReview = async (e) => {
//     e.preventDefault();
//     if (!token) {
//       showToast("Vui lòng đăng nhập để đánh giá.", false);
//       return;
//     }
//     try {
//       const res = await fetch(`${API}/products/${id}/reviews`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           rating: Number(rev.rating),
//           content: rev.content.trim(),
//         }),
//       });
//       if (!res.ok) throw new Error(await res.text());
//       const lst = await fetch(`${API}/products/${id}/reviews`).then((r) =>
//         r.json()
//       );
//       setReviews(Array.isArray(lst) ? lst : lst.data ?? []);
//       setShowForm(false);
//       setRev({ rating: 5, content: "" });
//       showToast("Đã gửi đánh giá. Cảm ơn bạn!", true);
//     } catch (err) {
//       console.error(err);
//       showToast("Gửi đánh giá thất bại.", false);
//     }
//   };

//   if (loading) return <div style={{ padding: 16 }}>Đang tải...</div>;
//   if (err) return <div style={{ padding: 16, color: "#d32f2f" }}>{err}</div>;
//   if (!product) return <div style={{ padding: 16 }}>Không tìm thấy sản phẩm.</div>;

//   const couponText = (c) => {
//     const head =
//       c.type === "percent"
//         ? `Giảm ${Number(c.value)}%`
//         : `Giảm ${VND.format(Number(c.value))}đ`;
//     const cap = c.max_discount ? ` (tối đa ${VND.format(Number(c.max_discount))}đ)` : "";
//     const min = c.min_order ? ` • ĐH tối thiểu ${VND.format(Number(c.min_order))}đ` : "";
//     return head + cap + min;
//   };

//   const dec = () => setQty((q) => Math.max(1, Number(q) - 1));

//   // ✅ Tồn kho: giới hạn tăng số lượng theo stock
//   const inc = () => setQty((q) => {
//     const next = Number(q) + 1;
//     if (outOfStock) return 1;
//     return Math.min(stock, Math.min(99, next));
//   });

//   // ✅ Tồn kho: giới hạn nhập tay
//   const onQtyInput = (e) => {
//     const v = e.target.value.replace(/\D/g, "");
//     let n = Math.max(1, Math.min(99, Number(v || 1)));
//     if (!outOfStock) n = Math.min(n, stock);
//     setQty(n);
//   };

//   // ✅ CSS thêm nhãn tồn kho
//   const styles = `
//   @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Poppins:wght@600;800;900&display=swap');
//   :root{
//     --pink-300:#fbcfe8; --green-300:#bbf7d0;
//     --pink-100:#ffe8f2; --green-100:#eafff3;
//     --ink:#0f172a; --muted:#64748b; --line:#e5e7eb;
//   }
//   .pd-page{padding:16px 24px;background:linear-gradient(180deg,#fff5fa,#f4fff9);font-family:Inter,sans-serif;}
//   .pd-card{display:grid;grid-template-columns:minmax(300px,520px)1fr;gap:24px;background:#fff;border:1px solid #f1f5f9;border-radius:16px;box-shadow:0 14px 34px rgba(2,6,23,.06);padding:20px;}
//   .pd-hero img{width:100%;height:100%;object-fit:cover;border-radius:12px;}
//   .pd-title{font-family:Poppins,sans-serif;font-weight:900;font-size:28px;background:linear-gradient(90deg,var(--pink-300),var(--green-300));-webkit-background-clip:text;color:transparent;margin:0 0 8px;}
//   .pd-meta{color:#475569; margin:4px 0 10px}
//   .pd-meta a{color:#2563eb; text-decoration:none}
//   .pd-prices{display:flex;align-items:center;gap:8px}
//   .pd-price-now{font-size:28px;font-weight:900;color:#111}
//   .pd-price-old{text-decoration:line-through;color:var(--muted)}
//   .pd-badge-off{background:var(--pink-100);color:#be185d;font-weight:800;padding:2px 8px;border-radius:999px;font-size:12px;border:1px dashed var(--pink-300);}
//   .pd-desc{color:#334155;line-height:1.6;margin:8px 0 12px}
//   .pd-desc strong{font-weight:bold;color:#111;}
//   .pd-desc em{font-style:italic;}
//   .pd-desc p{margin-bottom:6px;}
//   .pd-qty{display:flex;align-items:center;gap:12px;margin:12px 0}
//   .pd-actions{display:flex;gap:10px;margin-top:8px;flex-wrap:wrap}
//   .pd-btn-primary{padding:12px 18px;border:0;border-radius:12px;background:linear-gradient(135deg,var(--pink-300),var(--green-300));font-weight:900;cursor:pointer}
//   .pd-btn-ghost{padding:12px 16px;border:1px solid var(--pink-300);border-radius:12px;background:#fff;font-weight:800;color:#9d174d}
//   .stock{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-weight:800;font-size:12px;border:1px dashed #d1d5db;background:#f8fafc;color:#0f172a}
//   .stock.low{background:#fff7ed;color:#9a3412;border-color:#fed7aa}
//   .stock.out{background:#fee2e2;color:#991b1b;border-color:#fecaca}

//   /* Related */
//   .rel-wrap{margin-top:22px}
//   .rel-title{font-weight:800; font-size:20px; margin:6px 0 12px}
//   .rel-grid{display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px}
//   .rel-card{background:#fff;border:1px solid #f1f5f9;border-radius:12px; overflow:hidden}
//   .rel-card img{width:100%; height:150px; object-fit:cover}
//   .rel-body{padding:10px}
//   .rel-name{font-weight:700; font-size:14px; color:#0f172a; margin:0 0 4px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden}
//   .rel-price{font-weight:800}

//   /* Reviews */
//   .rv-wrap{margin-top:24px; background:#fff; border:1px solid #eef2f7; border-radius:12px; padding:16px}
//   .rv-title{font-weight:800; font-size:20px; margin-bottom:10px}
//   .rv-item{border-top:1px dashed #e5e7eb; padding:10px 0}
//   .rv-stars{color:#f59e0b; font-size:14px; margin-right:6px}
//   .rv-meta{color:#64748b; font-size:12px}
//   .rv-form{margin-top:12px; display:grid; gap:8px}
//   .rv-form textarea{min-height:90px; padding:10px; border:1px solid #e2e8f0; border-radius:8px}
//   .rv-form button{align-self:start; padding:10px 14px; border:0; border-radius:10px; background:#111; color:#fff; font-weight:800}
//   `;

//   return (
//     <div className="pd-page">
//       <style>{styles}</style>

//       {/* ====== Card chi tiết ====== */}
//       <div className="pd-card">
//         <div className="pd-hero">
//           <img
//             src={getThumb(product)}
//             onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
//             alt={product?.name}
//           />
//         </div>

//         <div>
//           <h1 className="pd-title">{product?.name}</h1>

//           {/* ✅ Brand & Danh mục */}
//           <div className="pd-meta">
//             {product?.brand_name && (
//               <>Thương hiệu: <b>{product.brand_name}</b> · </>
//             )}
//             {product?.category_id && (
//               <>
//                 Danh mục:{" "}
//                 <Link to={`/category/${product.category_id}`}>Xem danh mục</Link>
//               </>
//             )}
//           </div>

//           <div className="pd-prices">
//             <div className="pd-price-now">
//               ₫{VND.format(effectivePrice(product))}
//             </div>
//             {priceSale(product) > 0 && priceSale(product) < priceRoot(product) && (
//               <>
//                 <div className="pd-price-old">
//                   ₫{VND.format(priceRoot(product))}
//                 </div>
//                 {discount > 0 && (
//                   <span className="pd-badge-off">-{discount}%</span>
//                 )}
//               </>
//             )}
//           </div>

//           {/* ✅ Hiển thị tồn kho */}
//           <div style={{ marginTop: 8, marginBottom: 8 }}>
//             <span className={`stock ${outOfStock ? "out" : stock <= 5 ? "low" : ""}`}>
//               {outOfStock ? "Hết hàng" : `Còn ${VND.format(stock)} sản phẩm`}
//             </span>
//           </div>

//           {/* ✅ Mô tả có HTML */}
//           <div
//             className="pd-desc"
//             dangerouslySetInnerHTML={{
//               __html: product?.description || "<em>Không có mô tả</em>",
//             }}
//           ></div>

//           {/* ✅ Chi tiết sản phẩm */}
//           {product?.detail && (
//             <div
//               className="pd-desc"
//               dangerouslySetInnerHTML={{ __html: product.detail }}
//             ></div>
//           )}

//           {/* Số lượng & hành động */}
//           <div className="pd-qty">
//             <button onClick={dec} style={{ padding: "6px 12px" }} disabled={outOfStock}>−</button>
//             <input
//               value={outOfStock ? 0 : qty}
//               onChange={onQtyInput}
//               disabled={outOfStock}
//               style={{ width: 50, textAlign: "center" }}
//             />
//             <button onClick={inc} style={{ padding: "6px 12px" }} disabled={outOfStock}>+</button>
//           </div>

//           <div className="pd-actions">
//             <button
//               onClick={() =>
//                 pushToCart({
//                   id: product.id,
//                   name: product.name,
//                   price: effectivePrice(product),
//                   qty: outOfStock ? 0 : qty,
//                   thumbnail_url: getThumb(product),
//                 })
//               }
//               className="pd-btn-primary"
//               disabled={outOfStock}
//               title={outOfStock ? "Hết hàng" : "Thêm vào giỏ"}
//             >
//               {outOfStock ? "Hết hàng" : "Thêm vào giỏ"}
//             </button>
//             <Link to="/" className="pd-btn-ghost">
//               ← Tiếp tục mua
//             </Link>
//           </div>
//         </div>
//       </div>

//       {/* ====== Sản phẩm liên quan ====== */}
//       {!!related.length && (
//         <div className="rel-wrap">
//           <div className="rel-title">Sản phẩm liên quan</div>
//           <div className="rel-grid">
//             {related.map((r) => (
//            <Link key={r.id} to={`/products/${r.id}`} className="rel-card">
//                 <img
//                   src={r.thumbnail_url || r.thumbnail || PLACEHOLDER}
//                   onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
//                   alt={r.name}
//                 />
//                 <div className="rel-body">
//                   <div className="rel-name">{r.name}</div>
//                   <div className="rel-price">₫{VND.format(Number(r.price ?? r.price_sale ?? 0))}</div>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* ====== Đánh giá ====== */}
//       <div className="rv-wrap">
//         <div className="rv-title">Đánh giá</div>

//         {reviews.length === 0 ? (
//           <div className="rv-item" style={{ borderTop: "0" }}>
//             Chưa có đánh giá nào.
//           </div>
//         ) : (
//           reviews.map((rv) => (
//             <div key={rv.id || rv.created_at} className="rv-item">
//               <span className="rv-stars">{"★".repeat(rv.rating || 5)}</span>
//               <span className="rv-meta">
//                 {rv.user_name || "Người dùng"} • {rv.created_at?.slice(0, 10)}
//               </span>
//               <div style={{ marginTop: 4 }}>{rv.content}</div>
//             </div>
//           ))
//         )}

//         {canReview && (
//           <>
//             <button
//               onClick={() => setShowForm((s) => !s)}
//               style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff" }}
//             >
//               {showForm ? "Ẩn form đánh giá" : "Viết đánh giá"}
//             </button>

//             {showForm && (
//               <form className="rv-form" onSubmit={submitReview}>
//                 <div>
//                   <label>Chấm sao: </label>
//                   <select
//                     value={rev.rating}
//                     onChange={(e) => setRev((x) => ({ ...x, rating: e.target.value }))}
//                   >
//                     {[5,4,3,2,1].map((n) => (
//                       <option key={n} value={n}>{n} sao</option>
//                     ))}
//                   </select>
//                 </div>
//                 <textarea
//                   placeholder="Cảm nhận của bạn…"
//                   value={rev.content}
//                   onChange={(e) => setRev((x) => ({ ...x, content: e.target.value }))}
//                 />
//                 <button type="submit">Gửi đánh giá</button>
//               </form>
//             )}
//           </>
//         )}
//       </div>

//       {/* Toast nhỏ */}
//       {toast && (
//         <div
//           style={{
//             position: "fixed",
//             right: 16,
//             bottom: 16,
//             background: toast.ok ? "#16a34a" : "#dc2626",
//             color: "#fff",
//             padding: "10px 14px",
//             borderRadius: 10,
//             fontWeight: 700,
//           }}
//         >
//           {toast.msg}
//         </div>
//       )}
//     </div>
//   );
// }


import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";

const API = "http://127.0.0.1:8000/api";
const ALT = "http://127.0.0.1:8000";
const PLACEHOLDER = "https://placehold.co/400x300?text=No+Image";
const VND = new Intl.NumberFormat("vi-VN");

// ===== MÃ GIẢM GIÁ MẶC ĐỊNH (dùng khi API rỗng/500) =====
const DEMO_COUPONS = [
  { code: "GIAM10K", type: "flat", value: 10000 },
  { code: "GIAM20K", type: "flat", value: 20000 },
  { code: "GIAM50K", type: "flat", value: 50000 },
  { code: "GIAM10",  type: "percent", value: 10, max_discount: 50000, min_order: 100000 },
];

export default function ProductDetail({ addToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [coupons, setCoupons] = useState([]);
  const [savingCode, setSavingCode] = useState("");

  // ==== NEW: lưu mã đã lưu + copy clipboard ====
  const [savedCodes, setSavedCodes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("saved_coupons") || "[]"); }
    catch { return []; }
  });
  const isSaved = (code) => savedCodes.includes(code);
  const saveCode = (code) => {
    if (!code || isSaved(code)) return;
    setSavingCode(code);
    const next = [...savedCodes, code];
    setSavedCodes(next);
    localStorage.setItem("saved_coupons", JSON.stringify(next));
    showToast(`Đã lưu mã ${code}`);
    setTimeout(() => setSavingCode(""), 250);
  };
  const copyCode = async (code) => {
    try { await navigator.clipboard.writeText(code); showToast(`Đã sao chép mã ${code}`); }
    catch { showToast("Không sao chép được mã.", false); }
  };
  // ==============================================

  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rev, setRev] = useState({ rating: 5, content: "" });

  const [qty, setQty] = useState(1);

  const [toast, setToast] = useState(null);
  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 1800);
  };

  const getThumb = (p) =>
    p?.thumbnail_url || p?.thumbnail || p?.image_url || PLACEHOLDER;

  const priceRoot = (p) => Number(p?.price_root ?? p?.price ?? 0);
  const priceSale = (p) => Number(p?.price_sale ?? 0);
  const effectivePrice = (p) =>
    priceSale(p) > 0 && priceSale(p) < priceRoot(p) ? priceSale(p) : priceRoot(p);

  const discount = useMemo(() => {
    const r = priceRoot(product);
    const s = priceSale(product);
    if (r > 0 && s > 0 && s < r) return Math.round(((r - s) / r) * 100);
    return 0;
  }, [product]);

  // ✅ Tồn kho
  const stock = Number(product?.qty ?? 0);
  const outOfStock = stock <= 0;

  const pushToCart = (item) => {
    if (outOfStock) return showToast("Sản phẩm đã hết hàng.", false);
    if (item.qty > stock) return showToast(`Chỉ còn ${stock} sản phẩm trong kho.`, false);

    if (addToCart) {
      addToCart(item);
      showToast("🛒 Đã thêm vào giỏ!");
      return;
    }
    const load = () => { try { return JSON.parse(localStorage.getItem("cart") || "[]"); } catch { return []; } };
    const save = (v) => localStorage.setItem("cart", JSON.stringify(v));
    const cart = load();
    const idx = cart.findIndex((x) => x.id === item.id);
    if (idx >= 0) cart[idx].qty = Math.min(stock, cart[idx].qty + item.qty);
    else cart.push(item);
    save(cart);
    showToast("🛒 Đã thêm vào giỏ!");
    navigate("/cart");
  };

  // ---------- Fetch product + related ----------
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true); setErr("");
        let p = null;
        try {
          const r = await fetch(`${API}/products/${id}`, { signal: ac.signal });
          if (r.ok) { const d = await r.json(); p = d.data || d.product || d; }
        } catch {}
        if (!p) {
          const r2 = await fetch(`${ALT}/products/${id}`, { signal: ac.signal });
          if (!r2.ok) throw new Error(`HTTP ${r2.status}`);
          const d2 = await r2.json();
          p = d2.data || d2.product || d2;
        }
        setProduct(p);

        if (p?.category_id) {
          try {
            const rc = await fetch(`${API}/categories/${p.category_id}/products`, { signal: ac.signal });
            if (rc.ok) {
              const dd = await rc.json();
              const list = Array.isArray(dd) ? dd : dd.data ?? [];
              setRelated(list.filter(it => it.id !== Number(id)).slice(0, 8));
            } else setRelated([]);
          } catch { setRelated([]); }
        } else setRelated([]);
      } catch (e) {
        console.error(e); setErr("Không tải được sản phẩm.");
      } finally { setLoading(false); }
    })();
    return () => ac.abort();
  }, [id]);

  // ---------- Fetch coupons ----------
  useEffect(() => {
    if (!id) return;
    const ac = new AbortController();
    (async () => {
      try {
        const r = await fetch(`${API}/coupons?product_id=${id}`, { signal: ac.signal });
        if (!r.ok) { setCoupons([]); return; }
        const data = await r.json();
        setCoupons(Array.isArray(data) ? data : data.data ?? []);
      } catch { setCoupons([]); }
    })();
    return () => ac.abort();
  }, [id]);

  // ---------- Reviews ----------
  useEffect(() => {
    const ac = new AbortController();
    fetch(`${API}/products/${id}/reviews`, { signal: ac.signal })
      .then((r) => r.json())
      .then((d) => setReviews(Array.isArray(d) ? d : d.data ?? []))
      .catch(() => setReviews([]));

    if (token) {
      fetch(`${API}/products/${id}/can-review`, {
        headers: { Authorization: `Bearer ${token}` }, signal: ac.signal,
      })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d) => setCanReview(!!(d.can || d.allowed || d === true)))
        .catch(() => setCanReview(false));
    } else setCanReview(false);

    if (new URLSearchParams(location.search).get("review")) setShowForm(true);
    return () => ac.abort();
  }, [id, token, location.search]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!token) return showToast("Vui lòng đăng nhập để đánh giá.", false);
    try {
      const res = await fetch(`${API}/products/${id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating: Number(rev.rating), content: rev.content.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const lst = await fetch(`${API}/products/${id}/reviews`).then((r) => r.json());
      setReviews(Array.isArray(lst) ? lst : lst.data ?? []);
      setShowForm(false); setRev({ rating: 5, content: "" });
      showToast("Đã gửi đánh giá. Cảm ơn bạn!");
    } catch (err) {
      console.error(err); showToast("Gửi đánh giá thất bại.", false);
    }
  };

  if (loading) return <div style={{ padding: 16 }}>Đang tải...</div>;
  if (err) return <div style={{ padding: 16, color: "#d32f2f" }}>{err}</div>;
  if (!product) return <div style={{ padding: 16 }}>Không tìm thấy sản phẩm.</div>;

  const couponText = (c) => {
    const head = c.type === "percent"
      ? `Giảm ${Number(c.value)}%`
      : `Giảm ${VND.format(Number(c.value))}đ`;
    const cap = c.max_discount ? ` (tối đa ${VND.format(Number(c.max_discount))}đ)` : "";
    const min = c.min_order ? ` • ĐH tối thiểu ${VND.format(Number(c.min_order))}đ` : " • Không điều kiện";
    return head + cap + min;
  };

  // số lượng
  const dec = () => setQty((q) => Math.max(1, Number(q) - 1));
  const inc = () => setQty((q) => {
    const next = Number(q) + 1;
    if (outOfStock) return 1;
    return Math.min(stock, Math.min(99, next));
  });
  const onQtyInput = (e) => {
    const v = e.target.value.replace(/\D/g, "");
    let n = Math.max(1, Math.min(99, Number(v || 1)));
    if (!outOfStock) n = Math.min(n, stock);
    setQty(n);
  };

  // CSS
  const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Poppins:wght@600;800;900&display=swap');
  :root{ --pink-300:#fbcfe8; --green-300:#bbf7d0; --pink-100:#ffe8f2; --ink:#0f172a; --muted:#64748b; }
  .pd-page{padding:16px 24px;background:linear-gradient(180deg,#fff5fa,#f4fff9);font-family:Inter,sans-serif;}
  .pd-card{display:grid;grid-template-columns:minmax(300px,520px)1fr;gap:24px;background:#fff;border:1px solid #f1f5f9;border-radius:16px;box-shadow:0 14px 34px rgba(2,6,23,.06);padding:20px;}
  .pd-hero img{width:100%;height:100%;object-fit:cover;border-radius:12px;}
  .pd-title{font-family:Poppins,sans-serif;font-weight:900;font-size:28px;background:linear-gradient(90deg,var(--pink-300),var(--green-300));-webkit-background-clip:text;color:transparent;margin:0 0 8px;}
  .pd-meta{color:#475569; margin:4px 0 10px} .pd-meta a{color:#2563eb; text-decoration:none}
  .pd-prices{display:flex;align-items:center;gap:8px} .pd-price-now{font-size:28px;font-weight:900;color:#111}
  .pd-price-old{text-decoration:line-through;color:var(--muted)}
  .pd-badge-off{background:var(--pink-100);color:#be185d;font-weight:800;padding:2px 8px;border-radius:999px;font-size:12px;border:1px dashed var(--pink-300);}
  .pd-desc{color:#334155;line-height:1.6;margin:8px 0 12px}
  .pd-qty{display:flex;align-items:center;gap:12px;margin:12px 0}
  .pd-actions{display:flex;gap:10px;margin-top:8px;flex-wrap:wrap}
  .pd-btn-primary{padding:12px 18px;border:0;border-radius:12px;background:linear-gradient(135deg,var(--pink-300),var(--green-300));font-weight:900;cursor:pointer}
  .pd-btn-ghost{padding:12px 16px;border:1px solid var(--pink-300);border-radius:12px;background:#fff;font-weight:800;color:#9d174d}
  .stock{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-weight:800;font-size:12px;border:1px dashed #d1d5db;background:#f8fafc;color:#0f172a}

  /* Vouchers */
  .cpn-wrap{margin-top:18px}
  .cpn-title{font-weight:800;font-size:18px;margin:0 0 10px;color:#0f172a}
  .cpn-row{display:flex;gap:10px;overflow:auto;padding-bottom:4px}
  .cpn-card{min-width:220px;background:#fff;border:1px dashed #f9a8d4;border-radius:12px;padding:10px 12px}
  .cpn-head{font-weight:900;color:#be185d;margin-bottom:2px}
  .cpn-desc{font-size:12px;color:#6b7280;margin-bottom:8px}
  .cpn-code{display:inline-flex;align-items:center;gap:6px;font-weight:900;color:#be185d;border:1px dashed #f9a8d4;background:#fff1f7;padding:2px 8px;border-radius:999px}
  .cpn-actions{display:flex;gap:6px;margin-top:8px}
  .cpn-btn{border:1px solid #f9a8d4;background:#fff;border-radius:10px;padding:6px 10px;font-weight:800;color:#9d174d;cursor:pointer}
  .cpn-btn.primary{border:none;background:linear-gradient(135deg,var(--pink-300),var(--green-300));color:#111}
  .cpn-btn[disabled]{opacity:.55;cursor:not-allowed}

  /* Related */
  .rel-wrap{margin-top:22px} .rel-title{font-weight:800; font-size:20px; margin:6px 0 12px}
  .rel-grid{display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px}
  .rel-card{background:#fff;border:1px solid #f1f5f9;border-radius:12px; overflow:hidden}
  .rel-card img{width:100%; height:150px; object-fit:cover} .rel-body{padding:10px}
  .rel-name{font-weight:700; font-size:14px; color:#0f172a; margin:0 0 4px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden}
  .rel-price{font-weight:800}
  `;

  // Dùng API nếu có; nếu không thì dùng DEMO_COUPONS
  const couponsToShow = coupons && coupons.length > 0 ? coupons : DEMO_COUPONS;

  return (
    <div className="pd-page">
      <style>{styles}</style>

      {/* ====== Card chi tiết ====== */}
      <div className="pd-card">
        <div className="pd-hero">
          <img src={getThumb(product)} onError={(e)=> (e.currentTarget.src = PLACEHOLDER)} alt={product?.name}/>
        </div>

        <div>
          <h1 className="pd-title">{product?.name}</h1>

          {/* Brand & Danh mục */}
          <div className="pd-meta">
            {product?.brand_name && <>Thương hiệu: <b>{product.brand_name}</b> · </>}
            {product?.category_id && <>Danh mục: <Link to={`/category/${product.category_id}`}>Xem danh mục</Link></>}
          </div>

          <div className="pd-prices">
            <div className="pd-price-now">₫{VND.format(effectivePrice(product))}</div>
            {priceSale(product) > 0 && priceSale(product) < priceRoot(product) && (
              <>
                <div className="pd-price-old">₫{VND.format(priceRoot(product))}</div>
                {discount > 0 && <span className="pd-badge-off">-{discount}%</span>}
              </>
            )}
          </div>

          {/* Tồn kho */}
          <div style={{ marginTop: 8, marginBottom: 8 }}>
            <span className={`stock ${outOfStock ? "out" : stock <= 5 ? "low" : ""}`}>
              {outOfStock ? "Hết hàng" : `Còn ${VND.format(stock)} sản phẩm`}
            </span>
          </div>

          {/* Mô tả / Chi tiết (HTML) */}
          <div className="pd-desc" dangerouslySetInnerHTML={{ __html: product?.description || "<em>Không có mô tả</em>" }} />
          {product?.detail && <div className="pd-desc" dangerouslySetInnerHTML={{ __html: product.detail }} />}

          {/* Số lượng & hành động */}
          <div className="pd-qty">
            <button onClick={dec} style={{ padding: "6px 12px" }} disabled={outOfStock}>−</button>
            <input value={outOfStock ? 0 : qty} onChange={onQtyInput} disabled={outOfStock} style={{ width: 50, textAlign: "center" }}/>
            <button onClick={inc} style={{ padding: "6px 12px" }} disabled={outOfStock}>+</button>
          </div>

          <div className="pd-actions">
            <button
              onClick={() => pushToCart({ id: product.id, name: product.name, price: effectivePrice(product), qty: outOfStock ? 0 : qty, thumbnail_url: getThumb(product) })}
              className="pd-btn-primary"
              disabled={outOfStock}
              title={outOfStock ? "Hết hàng" : "Thêm vào giỏ"}
            >
              {outOfStock ? "Hết hàng" : "Thêm vào giỏ"}
            </button>
            <Link to="/" className="pd-btn-ghost">← Tiếp tục mua</Link>
          </div>
        </div>
      </div>

      {/* ====== MÃ GIẢM GIÁ – luôn hiện, fallback DEMO_COUPONS ====== */}
      <div className="cpn-wrap">
        <div className="cpn-title">Mã giảm giá áp dụng</div>

        {couponsToShow && couponsToShow.length > 0 ? (
          <div className="cpn-row">
            {couponsToShow.map((c) => {
              const code = c.code || c.coupon_code || "COUPON";
              return (
                <div key={c.id || code} className="cpn-card">
                  <div className="cpn-head">
                    {c.type === "percent" ? `Giảm ${Number(c.value)}%` : `Giảm ${VND.format(Number(c.value))}đ`}
                  </div>
                  <div className="cpn-desc">
                    {c.max_discount ? `Tối đa ${VND.format(Number(c.max_discount))}đ` : "Không giới hạn"}
                    {c.min_order ? ` • ĐH từ ${VND.format(Number(c.min_order))}đ` : " • Không điều kiện"}
                  </div>
                  <div className="cpn-code">{code}</div>
                  <div className="cpn-actions">
                    <button
                      className="cpn-btn primary"
                      onClick={() => saveCode(code)}
                      disabled={isSaved(code) || savingCode === code}
                      title={isSaved(code) ? "Đã lưu" : "Lưu mã"}
                    >
                      {isSaved(code) ? "Đã lưu" : (savingCode === code ? "Đang lưu..." : "Lưu mã")}
                    </button>
                    <button className="cpn-btn" onClick={() => copyCode(code)}>Sao chép</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ color: "#64748b", fontStyle: "italic" }}>Hiện chưa có mã giảm giá.</div>
        )}
      </div>

      {/* ====== Sản phẩm liên quan ====== */}
      {!!related.length && (
        <div className="rel-wrap">
          <div className="rel-title">Sản phẩm liên quan</div>
          <div className="rel-grid">
            {related.map((r) => (
              <Link key={r.id} to={`/products/${r.id}`} className="rel-card">
                <img src={r.thumbnail_url || r.thumbnail || PLACEHOLDER} onError={(e)=> (e.currentTarget.src = PLACEHOLDER)} alt={r.name}/>
                <div className="rel-body">
                  <div className="rel-name">{r.name}</div>
                  <div className="rel-price">₫{VND.format(Number(r.price ?? r.price_sale ?? 0))}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ====== Đánh giá ====== */}
      <div className="rv-wrap">
        <div className="rv-title">Đánh giá</div>

        {reviews.length === 0 ? (
          <div className="rv-item" style={{ borderTop: "0" }}>Chưa có đánh giá nào.</div>
        ) : (
          reviews.map((rv) => (
            <div key={rv.id || rv.created_at} className="rv-item">
              <span className="rv-stars">{"★".repeat(rv.rating || 5)}</span>
              <span className="rv-meta">{rv.user_name || "Người dùng"} • {rv.created_at?.slice(0, 10)}</span>
              <div style={{ marginTop: 4 }}>{rv.content}</div>
            </div>
          ))
        )}

        {canReview && (
          <>
            <button
              onClick={() => setShowForm((s) => !s)}
              style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff" }}
            >
              {showForm ? "Ẩn form đánh giá" : "Viết đánh giá"}
            </button>

            {showForm && (
              <form className="rv-form" onSubmit={submitReview}>
                <div>
                  <label>Chấm sao: </label>
                  <select value={rev.rating} onChange={(e) => setRev((x) => ({ ...x, rating: e.target.value }))}>
                    {[5,4,3,2,1].map((n) => (<option key={n} value={n}>{n} sao</option>))}
                  </select>
                </div>
                <textarea placeholder="Cảm nhận của bạn…" value={rev.content} onChange={(e) => setRev((x) => ({ ...x, content: e.target.value }))}/>
                <button type="submit">Gửi đánh giá</button>
              </form>
            )}
          </>
        )}
      </div>

      {/* Toast nhỏ */}
      {toast && (
        <div style={{ position: "fixed", right: 16, bottom: 16, background: toast.ok ? "#16a34a" : "#dc2626", color: "#fff", padding: "10px 14px", borderRadius: 10, fontWeight: 700 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
