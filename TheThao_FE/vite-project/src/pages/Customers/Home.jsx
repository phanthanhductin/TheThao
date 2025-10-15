// // src/pages/Customers/Home.jsx (LIGHT THEME)
// import { useEffect, useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import ProductCardHome from "../../components/ProductCardHome";

// const API_BASE = "http://127.0.0.1:8000";
// const PLACEHOLDER = "https://placehold.co/300x200?text=No+Image";

// /* ====== BANNER SLIDES ====== */
// const BANNERS = [
//   { src: `${API_BASE}/assets/images/banner.webp`, alt: "Siêu ưu đãi thể thao", link: "/products" },
//   { src: `${API_BASE}/assets/images/banner1.jpg`, alt: "Phong cách & hiệu năng", link: "/products?only_sale=1" },
//   { src: `${API_BASE}/assets/images/banner11.jpg`, alt: "Bùng nổ mùa giải mới", link: "/category/1" },
// ];

// /* ---------- Icon chevron ---------- */
// function IconChevron({ dir = "left", size = 24 }) {
//   return (
//     <svg width={size} height={size} viewBox="0 0 24 24"
//       fill="none" stroke="white" strokeWidth="2.2"
//       strokeLinecap="round" strokeLinejoin="round"
//       style={{ display: "block" }}>
//       {dir === "left" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
//     </svg>
//   );
// }

// /* ---------- Style nút mũi tên ---------- */
// function arrowStyle(side) {
//   const base = {
//     position: "absolute",
//     top: "50%", transform: "translateY(-50%)",
//     zIndex: 5, width: 48, height: 48,
//     borderRadius: 999,
//     border: "1px solid rgba(255,255,255,.6)",
//     background: "rgba(0,0,0,.45)",
//     color: "#fff", display: "grid", placeItems: "center",
//     cursor: "pointer",
//     boxShadow: "0 10px 26px rgba(0,0,0,.25)",
//     backdropFilter: "blur(3px)",
//     transition: "transform .2s ease, box-shadow .2s ease, background .2s ease, border-color .2s ease",
//     outline: "none",
//   };
//   return side === "left" ? { ...base, left: 18 } : { ...base, right: 18 };
// }

// /* ---------- Slider tự động ---------- */
// function BannerSlider({ banners = [], heightCSS = "clamp(360px, 50vw, 620px)", auto = 5000 }) {
//   const [idx, setIdx] = useState(0);
//   const touch = useRef({ x: 0, dx: 0, active: false });
//   const navigate = useNavigate();
//   const count = banners.length || 0;

//   const go = (n) => setIdx((p) => (count ? (p + n + count) % count : 0));
//   const goTo = (i) => setIdx(() => (count ? (i + count) % count : 0));

//   useEffect(() => { if (count && auto > 0) { const t = setInterval(() => go(1), auto); return () => clearInterval(t); } }, [count, auto]);
//   useEffect(() => {
//     const onKey = (e) => { if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1); };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, []);

//   const onTouchStart = (e) => { touch.current = { x: e.touches[0].clientX, dx: 0, active: true }; };
//   const onTouchMove = (e) => { if (touch.current.active) touch.current.dx = e.touches[0].clientX - touch.current.x; };
//   const onTouchEnd = () => { if (!touch.current.active) return; const dx = touch.current.dx; touch.current.active = false; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); };

//   if (!count) return null;

//   return (
//     <div style={{ position: "relative", height: heightCSS, overflow: "hidden" }}
//       onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
//       {/* Track */}
//       <div style={{
//         display: "flex", width: `${count * 100}%`, height: "100%",
//         transform: `translateX(-${idx * (100 / count)}%)`,
//         transition: "transform .55s ease",
//       }}>
//         {banners.map((b, i) => (
//           <button key={i} type="button" onClick={() => b.link && navigate(b.link)}
//             aria-label={b.alt || `Slide ${i + 1}`}
//             style={{
//               width: `${100 / count}%`, minWidth: `${100 / count}%`,
//               height: "100%", border: 0, padding: 0, cursor: b.link ? "pointer" : "default",
//               position: "relative", background: "#000",
//             }}>
//             <img
//               src={b.src} alt={b.alt || ""}
//               onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
//               style={{
//                 width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%",
//                 filter: "brightness(.82) contrast(1.06)",
//               }}
//               loading={i === 0 ? "eager" : "lazy"}
//             />
//             {/* Overlay nhẹ để chữ rõ */}
//             <div aria-hidden style={{
//               position: "absolute", inset: 0,
//               background: "linear-gradient(to top, rgba(0,0,0,.45), rgba(0,0,0,.18) 45%, rgba(0,0,0,0) 70%)",
//             }} />
//           </button>
//         ))}
//       </div>

//       {/* Arrows */}
//       {count > 1 && (
//         <>
//           <button
//             onClick={() => go(-1)} aria-label="Slide trước" style={arrowStyle("left")}
//             onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-50%) scale(1.07)"; e.currentTarget.style.boxShadow = "0 14px 32px rgba(0,0,0,.35)"; }}
//             onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(-50%)"; e.currentTarget.style.boxShadow = "0 10px 26px rgba(0,0,0,.25)"; }}
//           >
//             <IconChevron dir="left" />
//           </button>
//           <button
//             onClick={() => go(1)} aria-label="Slide sau" style={arrowStyle("right")}
//             onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-50%) scale(1.07)"; e.currentTarget.style.boxShadow = "0 14px 32px rgba(0,0,0,.35)"; }}
//             onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(-50%)"; e.currentTarget.style.boxShadow = "0 10px 26px rgba(0,0,0,.25)"; }}
//           >
//             <IconChevron dir="right" />
//           </button>
//         </>
//       )}

//       {/* Dots */}
//       {count > 1 && (
//         <div style={{
//           position: "absolute", left: 0, right: 0, bottom: 16,
//           display: "flex", alignItems: "center", justifyContent: "center", gap: 10, zIndex: 6,
//         }}>
//           {banners.map((_, i) => (
//             <button key={i} onClick={() => goTo(i)} aria-label={`Tới slide ${i + 1}`}
//               style={{
//                 width: i === idx ? 14 : 11, height: i === idx ? 14 : 11,
//                 borderRadius: 999, border: 0,
//                 background: i === idx ? "#111827" : "rgba(255,255,255,.8)",
//                 transform: i === idx ? "scale(1.05)" : "scale(1)",
//                 transition: "transform .2s ease, background .2s ease, width .2s ease, height .2s ease",
//                 cursor: "pointer",
//                 boxShadow: i === idx ? "0 0 0 2px rgba(0,0,0,.15)" : "none",
//               }} />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// /* ---------- Card danh mục (light) ---------- */
// function CategoryCard({ c, onClick, style }) {
//   return (
//     <button
//       type="button" onClick={onClick}
//       style={{
//         background: "#ffffff",
//         borderRadius: 14,
//         boxShadow: "0 10px 22px rgba(2,6,23,.06)",
//         padding: 16,
//         minWidth: 300, width: 320,
//         textAlign: "center",
//         fontWeight: 800, fontSize: 18, color: "#0f172a",
//         border: "1px solid #e5e7eb",
//         cursor: "pointer",
//         transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
//         ...style,
//       }}
//       onMouseEnter={(e) => {
//         e.currentTarget.style.transform = "translateY(-3px)";
//         e.currentTarget.style.boxShadow = "0 16px 28px rgba(2,6,23,.12)";
//         e.currentTarget.style.borderColor = "#cbd5e1";
//       }}
//       onMouseLeave={(e) => {
//         e.currentTarget.style.transform = "translateY(0)";
//         e.currentTarget.style.boxShadow = "0 10px 22px rgba(2,6,23,.06)";
//         e.currentTarget.style.borderColor = "#e5e7eb";
//       }}
//     >
//       <div style={{
//         height: 160, marginBottom: 10, overflow: "hidden",
//         borderRadius: 10, background: "#f3f4f6", border: "1px solid #e5e7eb",
//       }}>
//         <img
//           src={c.image_url || PLACEHOLDER} alt={c.name}
//           style={{ width: "100%", height: "100%", objectFit: "cover" }}
//           onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
//         />
//       </div>
//       {c.name}
//     </button>
//   );
// }

// export default function Home() {
//   const [categories, setCategories] = useState([]);
//   const [newItems, setNewItems] = useState([]);
//   const [saleItems, setSaleItems] = useState([]);
//   const [suggestItems, setSuggestItems] = useState([]); // 1 hàng gợi ý
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   useEffect(() => {
//     const ac = new AbortController();
//     (async () => {
//       try {
//         setLoading(true); setError("");

//         const resCats = await fetch(`${API_BASE}/categories`, { signal: ac.signal });
//         if (!resCats.ok) throw new Error(`HTTP ${resCats.status}`);
//         const cats = await resCats.json();
//         setCategories(Array.isArray(cats) ? cats : cats?.data ?? []);

//         const resProds = await fetch(`${API_BASE}/products`, { signal: ac.signal });
//         if (!resProds.ok) throw new Error(`HTTP ${resProds.status}`);
//         const prods = await resProds.json();
//         const list = Array.isArray(prods) ? prods : prods?.data ?? [];

//         const normalized = list.map((p) => ({
//           ...p,
//           price_root: Number(p.price_root ?? 0),
//           price_sale: Number(p.price_sale ?? p.price ?? 0),
//         }));

//         const _new = normalized.slice(0, 8);
//         const _sale = normalized
//           .filter((x) => x.price_root > 0 && x.price_sale > 0 && x.price_sale < x.price_root)
//           .slice(0, 8);

//         setNewItems(_new);
//         setSaleItems(_sale);

//         const exclude = new Set([..._new.map((x) => x.id), ..._sale.map((x) => x.id)]);
//         let suggestion = normalized.filter((p) => !exclude.has(p.id)).slice(0, 4);
//         if (suggestion.length < 4) {
//           const filler = normalized.filter((p) => !suggestion.find((s) => s.id === p.id));
//           suggestion = suggestion.concat(filler.slice(0, 4 - suggestion.length));
//         }
//         setSuggestItems(suggestion.slice(0, 4));
//       } catch (err) {
//         if (err.name !== "AbortError") setError("Không tải được dữ liệu");
//       } finally {
//         setLoading(false);
//       }
//     })();
//     return () => ac.abort();
//   }, []);

//   const topCats = categories.slice(0, 2);
//   const bottomCats = categories.slice(2, 5);
//   const restCats = categories.slice(5);

//   return (
//     <div style={{
//       fontFamily: "Montserrat, Arial, sans-serif",
//       background: "#ffffff", color: "#0f172a", minHeight: "100vh",
//     }}>
//       <LightStyle />

//       {/* ====== HERO ====== */}
//       <section style={{ position: "relative", overflow: "hidden" }}>
//         <BannerSlider banners={BANNERS} heightCSS="clamp(360px, 50vw, 620px)" auto={5000} />

//         {/* Text ở giữa banner */}
//         <div style={{
//           position: "absolute", zIndex: 4, top: "50%", left: "50%",
//           transform: "translate(-50%, -50%)",
//           textAlign: "center", color: "#ffffff", width: "min(92%, 1100px)",
//           textShadow: "0 2px 14px rgba(0,0,0,.45)",
//         }}>
//           <h1 style={{
//             fontSize: "clamp(28px, 5vw, 56px)", fontWeight: 900,
//             marginBottom: 14, textTransform: "uppercase", letterSpacing: 2,
//           }}>
//             THETHAO SPORTS
//           </h1>
//           <p style={{ fontSize: "clamp(14px, 2.2vw, 22px)", fontWeight: 600, marginBottom: 22 }}>
//             Hiệu năng bùng nổ – Phong cách thể thao hiện đại
//           </p>
//           <button
//             style={{
//               padding: "12px 28px", borderRadius: 28, border: "1px solid rgba(255,255,255,.7)",
//               background: "rgba(255,255,255,.12)", color: "#fff", fontSize: 16, fontWeight: 800,
//               cursor: "pointer", transition: "transform .18s ease, box-shadow .18s ease, background .18s ease",
//               boxShadow: "0 8px 24px rgba(0,0,0,.25)",
//               backdropFilter: "blur(2px)",
//             }}
//             onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.background = "rgba(255,255,255,.2)"; }}
//             onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "rgba(255,255,255,.12)"; }}
//             onClick={() => navigate("/products")}
//           >
//             Khám phá ngay
//           </button>
//         </div>
//       </section>

//       {/* ====== DANH MỤC NỔI BẬT ====== */}
//       <section style={{ margin: "54px 0" }}>
//         <h2 className="lt-section-title">Danh mục nổi bật</h2>

//         {categories.length === 0 ? (
//           <p style={{ textAlign: "center", color: "#6b7280" }}>Chưa có danh mục.</p>
//         ) : (
//           <div className="lt-wrap">
//             <div style={{ display: "flex", gap: 24, justifyContent: "center", marginBottom: 18 }}>
//               {topCats.map((c) => (
//                 <CategoryCard key={c.id} c={c} onClick={() => navigate(`/category/${c.id}`)} />
//               ))}
//             </div>

//             <div style={{ display: "flex", gap: 24, justifyContent: "center", marginBottom: restCats.length ? 28 : 0 }}>
//               {bottomCats.map((c) => (
//                 <CategoryCard key={c.id} c={c} onClick={() => navigate(`/category/${c.id}`)} style={{ transform: "translateY(6px)" }} />
//               ))}
//             </div>

//             {restCats.length > 0 && (
//               <>
//                 <h3 style={{ textAlign: "center", color: "#6b7280", fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
//                   Các danh mục khác
//                 </h3>
//                 <div style={{ display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap" }}>
//                   {restCats.map((c) => (
//                     <CategoryCard key={c.id} c={c} onClick={() => navigate(`/category/${c.id}`)} />
//                   ))}
//                 </div>
//               </>
//             )}
//           </div>
//         )}
//       </section>

//       {/* ====== TRẠNG THÁI ====== */}
//       {loading && <p style={{ textAlign: "center", color: "#2563eb" }}>Đang tải dữ liệu...</p>}
//       {error && <p style={{ textAlign: "center", color: "#dc2626" }}>{error}</p>}

//       {/* ====== LƯỚI SẢN PHẨM ====== */}
//       {!loading && !error && (
//         <>
//           {/* Sản phẩm mới */}
//           <section style={{ margin: "52px 0" }}>
//             <h2 className="lt-section-title">Sản phẩm mới</h2>
//             <div className="lt-wrap">
//               <div className="lt-grid4">
//                 {newItems.slice(0, 8).map((p) => <ProductCardHome key={p.id} p={p} />)}
//               </div>
//             </div>
//           </section>

//           {/* Đang giảm giá */}
//           <section style={{ margin: "52px 0" }}>
//             <h2 className="lt-section-title">Đang giảm giá</h2>
//             <div className="lt-wrap">
//               <div className="lt-grid4">
//                 {saleItems.slice(0, 8).map((p) => <ProductCardHome key={p.id} p={p} />)}
//               </div>
//             </div>
//           </section>

//           {/* Gợi ý cho bạn */}
//           <section style={{ margin: "44px 0" }}>
//             <h2 className="lt-section-title">Gợi ý cho bạn</h2>
//             <div className="lt-wrap">
//               <div className="lt-grid4">
//                 {suggestItems.slice(0, 4).map((p) => <ProductCardHome key={p.id} p={p} />)}
//               </div>
//             </div>
//           </section>
//         </>
//       )}

//       {/* ====== Footer/info (card nhạt) ====== */}
//       <section style={{
//         background: "#f8fafc", borderRadius: 16, border: "1px solid #e5e7eb",
//         boxShadow: "0 8px 22px rgba(2,6,23,.06)", padding: "28px 22px",
//         margin: "50px auto 10px", maxWidth: 760, textAlign: "center",
//       }}>
//         <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10, color: "#0f172a", textTransform: "uppercase" }}>
//           ⚽ Cảm ơn bạn đã đồng hành cùng SPORT OH!
//         </h2>
//         <p style={{ color: "#334155", fontSize: 16, lineHeight: 1.6 }}>
//           THETHAO SPORTS mang đến trang phục & phụ kiện thể thao chính hãng, bền bỉ và thời
//           thượng. Chúng tôi tối ưu hiệu năng cho từng chuyển động, để bạn tự tin luyện tập,
//           thi đấu và phá vỡ giới hạn mỗi ngày.
//         </p>
//       </section>
//     </div>
//   );
// }

// /* ====== CSS LIGHT ====== */
// function LightStyle() {
//   return (
//     <style>{`
//       .lt-wrap{ max-width:1200px; margin:0 auto; padding:0 12px; }

//       .lt-grid4{
//         display:grid; grid-template-columns: repeat(4, minmax(0,1fr));
//         gap:20px; align-items:stretch;
//       }
//       @media (max-width:1024px){ .lt-grid4{ grid-template-columns: repeat(3, minmax(0,1fr)); } }
//       @media (max-width:768px){ .lt-grid4{ grid-template-columns: repeat(2, minmax(0,1fr)); } }
//       @media (max-width:480px){ .lt-grid4{ grid-template-columns: 1fr; } }

//       /* TITLE – đậm, màu đen, gạch chân gradient */
//       .lt-section-title{
//         font-size: clamp(22px, 3.2vw, 28px);
//         font-weight: 1000;
//         letter-spacing: .8px;
//         text-transform: uppercase;
//         margin: 0 auto 18px;
//         display: block;
//         text-align:center;
//         color:#0f172a;
//         text-shadow: 0 1px 0 #ffffff, 0 8px 18px rgba(2,6,23,.06);
//         position: relative;
//         padding-bottom: 10px;
//         width: max-content;
//       }
//       .lt-section-title::after{
//         content:"";
//         position:absolute; left:0; right:0; bottom:0;
//         height:4px; border-radius:3px;
//         background: linear-gradient(90deg,#6366f1,#a78bfa,#60a5fa);
//         box-shadow: 0 4px 14px rgba(99,102,241,.25);
//       }
//     `}</style>
//   );
// }




// src/pages/Customers/Home.jsx (LIGHT THEME)
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductCardHome from "../../components/ProductCardHome";

const API_BASE = "http://127.0.0.1:8000";
const PLACEHOLDER = "https://placehold.co/300x200?text=No+Image";

/* ====== BANNER SLIDES ====== */
const BANNERS = [
  { src: `${API_BASE}/assets/images/banner.webp`, alt: "Siêu ưu đãi thể thao", link: "/products" },
  { src: `${API_BASE}/assets/images/banner1.jpg`, alt: "Phong cách & hiệu năng", link: "/products?only_sale=1" },
  { src: `${API_BASE}/assets/images/banner11.jpg`, alt: "Bùng nổ mùa giải mới", link: "/category/1" },
];

/* ---------- Icon chevron ---------- */
function IconChevron({ dir = "left", size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="white" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "block" }}>
      {dir === "left" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
    </svg>
  );
}

/* ---------- Style nút mũi tên ---------- */
function arrowStyle(side) {
  const base = {
    position: "absolute",
    top: "50%", transform: "translateY(-50%)",
    zIndex: 5, width: 48, height: 48,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.6)",
    background: "rgba(0,0,0,.45)",
    color: "#fff", display: "grid", placeItems: "center",
    cursor: "pointer",
    boxShadow: "0 10px 26px rgba(0,0,0,.25)",
    backdropFilter: "blur(3px)",
    transition: "transform .2s ease, box-shadow .2s ease, background .2s ease, border-color .2s ease",
    outline: "none",
  };
  return side === "left" ? { ...base, left: 18 } : { ...base, right: 18 };
}

/* ---------- Slider tự động ---------- */
function BannerSlider({ banners = [], heightCSS = "clamp(360px, 50vw, 620px)", auto = 5000 }) {
  const [idx, setIdx] = useState(0);
  const touch = useRef({ x: 0, dx: 0, active: false });
  const navigate = useNavigate();
  const count = banners.length || 0;

  const go = (n) => setIdx((p) => (count ? (p + n + count) % count : 0));
  const goTo = (i) => setIdx(() => (count ? (i + count) % count : 0));

  useEffect(() => { if (count && auto > 0) { const t = setInterval(() => go(1), auto); return () => clearInterval(t); } }, [count, auto]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onTouchStart = (e) => { touch.current = { x: e.touches[0].clientX, dx: 0, active: true }; };
  const onTouchMove = (e) => { if (touch.current.active) touch.current.dx = e.touches[0].clientX - touch.current.x; };
  const onTouchEnd = () => { if (!touch.current.active) return; const dx = touch.current.dx; touch.current.active = false; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); };

  if (!count) return null;

  return (
    <div style={{ position: "relative", height: heightCSS, overflow: "hidden" }}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      {/* Track */}
      <div style={{
        display: "flex", width: `${count * 100}%`, height: "100%",
        transform: `translateX(-${idx * (100 / count)}%)`,
        transition: "transform .55s ease",
      }}>
        {banners.map((b, i) => (
          <button key={i} type="button" onClick={() => b.link && navigate(b.link)}
            aria-label={b.alt || `Slide ${i + 1}`}
            style={{
              width: `${100 / count}%`, minWidth: `${100 / count}%`,
              height: "100%", border: 0, padding: 0, cursor: b.link ? "pointer" : "default",
              position: "relative", background: "#000",
            }}>
            <img
              src={b.src} alt={b.alt || ""}
              onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
              style={{
                width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%",
                filter: "brightness(.82) contrast(1.06)",
              }}
              loading={i === 0 ? "eager" : "lazy"}
            />
            {/* Overlay nhẹ để chữ rõ */}
            <div aria-hidden style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,.45), rgba(0,0,0,.18) 45%, rgba(0,0,0,0) 70%)",
            }} />
          </button>
        ))}
      </div>

      {/* Arrows */}
      {count > 1 && (
        <>
          <button
            onClick={() => go(-1)} aria-label="Slide trước" style={arrowStyle("left")}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-50%) scale(1.07)"; e.currentTarget.style.boxShadow = "0 14px 32px rgba(0,0,0,.35)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(-50%)"; e.currentTarget.style.boxShadow = "0 10px 26px rgba(0,0,0,.25)"; }}
          >
            <IconChevron dir="left" />
          </button>
          <button
            onClick={() => go(1)} aria-label="Slide sau" style={arrowStyle("right")}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-50%) scale(1.07)"; e.currentTarget.style.boxShadow = "0 14px 32px rgba(0,0,0,.35)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(-50%)"; e.currentTarget.style.boxShadow = "0 10px 26px rgba(0,0,0,.25)"; }}
          >
            <IconChevron dir="right" />
          </button>
        </>
      )}

      {/* Dots */}
      {count > 1 && (
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 16,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10, zIndex: 6,
        }}>
          {banners.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`Tới slide ${i + 1}`}
              style={{
                width: i === idx ? 14 : 11, height: i === idx ? 14 : 11,
                borderRadius: 999, border: 0,
                background: i === idx ? "#111827" : "rgba(255,255,255,.8)",
                transform: i === idx ? "scale(1.05)" : "scale(1)",
                transition: "transform .2s ease, background .2s ease, width .2s ease, height .2s ease",
                cursor: "pointer",
                boxShadow: i === idx ? "0 0 0 2px rgba(0,0,0,.15)" : "none",
              }} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- SEARCH BAR with autocomplete ---------- */
function SearchBar() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]); // gợi ý
  const [highlight, setHighlight] = useState(-1);
  const nav = useNavigate();
  const boxRef = useRef(null);
  const abortRef = useRef(null);
  const timerRef = useRef(null);

  // click ngoài để đóng
  useEffect(() => {
    const fn = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // debounce gọi API
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (!q || q.trim().length < 1) {
      setItems([]);
      setLoading(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const url = `${API_BASE}/products?q=${encodeURIComponent(q.trim())}&per_page=8`;
        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.data ?? [];
        // Chuẩn hoá trường ảnh
        const mapped = list.map((p) => ({
          id: p.id,
          name: p.name || p.title || `#${p.id}`,
          thumbnail_url: p.thumbnail_url || (p.thumbnail ? `${API_BASE}/storage/${p.thumbnail}` : null),
          slug: p.slug,
        }));
        setItems(mapped);
        setOpen(true);
      } catch (e) {
        // ignore khi abort
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [q]);

  const goSearch = () => {
    const key = (q || "").trim();
    if (!key) return;
    setOpen(false);
    nav(`/products?q=${encodeURIComponent(key)}`);
  };

  const goDetail = (id) => {
    setOpen(false);
    nav(`/product/${id}`);
  };

  const onKeyDown = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (highlight >= 0 && items[highlight]) {
        goDetail(items[highlight].id);
      } else {
        goSearch();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className="sb-wrap">
      <div className="sb-box">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => (items.length ? setOpen(true) : null)}
          onKeyDown={onKeyDown}
          placeholder="Tìm nhanh: giày, áo, tất... (gõ để gợi ý)"
          className="sb-input"
          aria-label="Tìm kiếm sản phẩm"
        />
        <button className="sb-btn" onClick={goSearch} aria-label="Tìm kiếm">
          🔍
        </button>
      </div>

      {/* dropdown */}
      {open && (
        <div className="sb-dd">
          {loading && <div className="sb-dd-row muted">Đang tìm...</div>}
          {!loading && items.length === 0 && (
            <div className="sb-dd-row muted">Không có kết quả phù hợp</div>
          )}
          {!loading &&
            items.map((it, i) => (
              <button
                type="button"
                key={it.id}
                className={`sb-dd-row ${i === highlight ? "active" : ""}`}
                onMouseEnter={() => setHighlight(i)}
                onMouseLeave={() => setHighlight(-1)}
                onClick={() => goDetail(it.id)}
              >
                <div className="sb-thumb">
                  <img
                    src={it.thumbnail_url || PLACEHOLDER}
                    alt={it.name}
                    onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                  />
                </div>
                <div className="sb-name">{it.name}</div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Card danh mục (light) ---------- */
function CategoryCard({ c, onClick, style }) {
  return (
    <button
      type="button" onClick={onClick}
      style={{
        background: "#ffffff",
        borderRadius: 14,
        boxShadow: "0 10px 22px rgba(2,6,23,.06)",
        padding: 16,
        minWidth: 300, width: 320,
        textAlign: "center",
        fontWeight: 800, fontSize: 18, color: "#0f172a",
        border: "1px solid #e5e7eb",
        cursor: "pointer",
        transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 16px 28px rgba(2,6,23,.12)";
        e.currentTarget.style.borderColor = "#cbd5e1";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 10px 22px rgba(2,6,23,.06)";
        e.currentTarget.style.borderColor = "#e5e7eb";
      }}
    >
      <div style={{
        height: 160, marginBottom: 10, overflow: "hidden",
        borderRadius: 10, background: "#f3f4f6", border: "1px solid #e5e7eb",
      }}>
        <img
          src={c.image_url || PLACEHOLDER} alt={c.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
        />
      </div>
      {c.name}
    </button>
  );
}

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [newItems, setNewItems] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const [suggestItems, setSuggestItems] = useState([]); // 1 hàng gợi ý
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true); setError("");

        const resCats = await fetch(`${API_BASE}/categories`, { signal: ac.signal });
        if (!resCats.ok) throw new Error(`HTTP ${resCats.status}`);
        const cats = await resCats.json();
        setCategories(Array.isArray(cats) ? cats : cats?.data ?? []);

        const resProds = await fetch(`${API_BASE}/products`, { signal: ac.signal });
        if (!resProds.ok) throw new Error(`HTTP ${resProds.status}`);
        const prods = await resProds.json();
        const list = Array.isArray(prods) ? prods : prods?.data ?? [];

        const normalized = list.map((p) => ({
          ...p,
          price_root: Number(p.price_root ?? 0),
          price_sale: Number(p.price_sale ?? p.price ?? 0),
        }));

        const _new = normalized.slice(0, 8);
        const _sale = normalized
          .filter((x) => x.price_root > 0 && x.price_sale > 0 && x.price_sale < x.price_root)
          .slice(0, 8);

        setNewItems(_new);
        setSaleItems(_sale);

        const exclude = new Set([..._new.map((x) => x.id), ..._sale.map((x) => x.id)]);
        let suggestion = normalized.filter((p) => !exclude.has(p.id)).slice(0, 4);
        if (suggestion.length < 4) {
          const filler = normalized.filter((p) => !suggestion.find((s) => s.id === p.id));
          suggestion = suggestion.concat(filler.slice(0, 4 - suggestion.length));
        }
        setSuggestItems(suggestion.slice(0, 4));
      } catch (err) {
        if (err.name !== "AbortError") setError("Không tải được dữ liệu");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const topCats = categories.slice(0, 2);
  const bottomCats = categories.slice(2, 5);
  const restCats = categories.slice(5);

  return (
    <div style={{
      fontFamily: "Montserrat, Arial, sans-serif",
      background: "#ffffff", color: "#0f172a", minHeight: "100vh",
    }}>
      <LightStyle />
      <SearchBarStyle />

      {/* ====== HERO ====== */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <BannerSlider banners={BANNERS} heightCSS="clamp(360px, 50vw, 620px)" auto={5000} />

        {/* Text ở giữa banner */}
        <div style={{
          position: "absolute", zIndex: 4, top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center", color: "#ffffff", width: "min(92%, 1100px)",
          textShadow: "0 2px 14px rgba(0,0,0,.45)",
        }}>
          <h1 style={{
            fontSize: "clamp(28px, 5vw, 56px)", fontWeight: 900,
            marginBottom: 14, textTransform: "uppercase", letterSpacing: 2,
          }}>
            THETHAO SPORTS
          </h1>
          <p style={{ fontSize: "clamp(14px, 2.2vw, 22px)", fontWeight: 600, marginBottom: 22 }}>
            Hiệu năng bùng nổ – Phong cách thể thao hiện đại
          </p>

          {/* === SearchBar đặt ngay dưới hero text === */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <SearchBar />
          </div>
        </div>
      </section>

      {/* ====== DANH MỤC NỔI BẬT ====== */}
      <section style={{ margin: "54px 0" }}>
        <h2 className="lt-section-title">Danh mục nổi bật</h2>

        {categories.length === 0 ? (
          <p style={{ textAlign: "center", color: "#6b7280" }}>Chưa có danh mục.</p>
        ) : (
          <div className="lt-wrap">
            <div style={{ display: "flex", gap: 24, justifyContent: "center", marginBottom: 18 }}>
              {topCats.map((c) => (
                <CategoryCard key={c.id} c={c} onClick={() => navigate(`/category/${c.id}`)} />
              ))}
            </div>

            <div style={{ display: "flex", gap: 24, justifyContent: "center", marginBottom: restCats.length ? 28 : 0 }}>
              {bottomCats.map((c) => (
                <CategoryCard key={c.id} c={c} onClick={() => navigate(`/category/${c.id}`)} style={{ transform: "translateY(6px)" }} />
              ))}
            </div>

            {restCats.length > 0 && (
              <>
                <h3 style={{ textAlign: "center", color: "#6b7280", fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
                  Các danh mục khác
                </h3>
                <div style={{ display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap" }}>
                  {restCats.map((c) => (
                    <CategoryCard key={c.id} c={c} onClick={() => navigate(`/category/${c.id}`)} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* ====== TRẠNG THÁI ====== */}
      {loading && <p style={{ textAlign: "center", color: "#2563eb" }}>Đang tải dữ liệu...</p>}
      {error && <p style={{ textAlign: "center", color: "#dc2626" }}>{error}</p>}

      {/* ====== LƯỚI SẢN PHẨM ====== */}
      {!loading && !error && (
        <>
          {/* Sản phẩm mới */}
          <section style={{ margin: "52px 0" }}>
            <h2 className="lt-section-title">Sản phẩm mới</h2>
            <div className="lt-wrap">
              <div className="lt-grid4">
                {newItems.slice(0, 8).map((p) => <ProductCardHome key={p.id} p={p} />)}
              </div>
            </div>
          </section>

          {/* Đang giảm giá */}
          <section style={{ margin: "52px 0" }}>
            <h2 className="lt-section-title">Đang giảm giá</h2>
            <div className="lt-wrap">
              <div className="lt-grid4">
                {saleItems.slice(0, 8).map((p) => <ProductCardHome key={p.id} p={p} />)}
              </div>
            </div>
          </section>

          {/* Gợi ý cho bạn */}
          <section style={{ margin: "44px 0" }}>
            <h2 className="lt-section-title">Gợi ý cho bạn</h2>
            <div className="lt-wrap">
              <div className="lt-grid4">
                {suggestItems.slice(0, 4).map((p) => <ProductCardHome key={p.id} p={p} />)}
              </div>
            </div>
          </section>
        </>
      )}

      {/* ====== Footer/info (card nhạt) ====== */}
      <section style={{
        background: "#f8fafc", borderRadius: 16, border: "1px solid #e5e7eb",
        boxShadow: "0 8px 22px rgba(2,6,23,.06)", padding: "28px 22px",
        margin: "50px auto 10px", maxWidth: 760, textAlign: "center",
      }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10, color: "#0f172a", textTransform: "uppercase" }}>
          ⚽ Cảm ơn bạn đã đồng hành cùng SPORT OH!
        </h2>
        <p style={{ color: "#334155", fontSize: 16, lineHeight: 1.6 }}>
          THETHAO SPORTS mang đến trang phục & phụ kiện thể thao chính hãng, bền bỉ và thời
          thượng. Chúng tôi tối ưu hiệu năng cho từng chuyển động, để bạn tự tin luyện tập,
          thi đấu và phá vỡ giới hạn mỗi ngày.
        </p>
      </section>
    </div>
  );
}

/* ====== CSS LIGHT ====== */
function LightStyle() {
  return (
    <style>{`
      .lt-wrap{ max-width:1200px; margin:0 auto; padding:0 12px; }

      .lt-grid4{
        display:grid; grid-template-columns: repeat(4, minmax(0,1fr));
        gap:20px; align-items:stretch;
      }
      @media (max-width:1024px){ .lt-grid4{ grid-template-columns: repeat(3, minmax(0,1fr)); } }
      @media (max-width:768px){ .lt-grid4{ grid-template-columns: repeat(2, minmax(0,1fr)); } }
      @media (max-width:480px){ .lt-grid4{ grid-template-columns: 1fr; } }

      /* TITLE – đậm, màu đen, gạch chân gradient */
      .lt-section-title{
        font-size: clamp(22px, 3.2vw, 28px);
        font-weight: 1000;
        letter-spacing: .8px;
        text-transform: uppercase;
        margin: 0 auto 18px;
        display: block;
        text-align:center;
        color:#0f172a;
        text-shadow: 0 1px 0 #ffffff, 0 8px 18px rgba(2,6,23,.06);
        position: relative;
        padding-bottom: 10px;
        width: max-content;
      }
      .lt-section-title::after{
        content:"";
        position:absolute; left:0; right:0; bottom:0;
        height:4px; border-radius:3px;
        background: linear-gradient(90deg,#6366f1,#a78bfa,#60a5fa);
        box-shadow: 0 4px 14px rgba(99,102,241,.25);
      }
    `}</style>
  );
}

/* ====== CSS cho SearchBar ====== */
function SearchBarStyle() {
  return (
    <style>{`
      .sb-wrap { position: relative; width: min(760px, 92vw); }
      .sb-box {
        display:flex; align-items:center; gap:10px;
        background: rgba(255,255,255,.16);
        border: 1px solid rgba(255,255,255,.6);
        border-radius: 40px;
        box-shadow: 0 12px 26px rgba(0,0,0,.25);
        padding: 10px 12px 10px 16px;
        backdrop-filter: blur(3px);
        transition: transform .15s ease, box-shadow .15s ease, background .15s ease, border-color .15s ease;
      }
      .sb-box:focus-within {
        transform: scale(1.01);
        box-shadow: 0 18px 36px rgba(0,0,0,.32);
        background: rgba(255,255,255,.22);
        border-color: rgba(255,255,255,.9);
      }
      .sb-input{
        flex:1; height: 42px; font-size:16px; font-weight:700;
        color:#fff; background:transparent; border:0; outline:none;
        letter-spacing:.3px;
      }
      .sb-input::placeholder{ color: rgba(255,255,255,.85); font-weight:600; }
      .sb-btn{
        height:40px; min-width:40px;
        border-radius:999px; border:0; cursor:pointer;
        background: rgba(0,0,0,.35); color:#fff;
        box-shadow: 0 6px 16px rgba(0,0,0,.25);
      }
      .sb-dd{
        position:absolute; left:0; right:0; top: calc(100% + 8px);
        background:#ffffff; border:1px solid #e5e7eb; border-radius: 14px;
        box-shadow: 0 16px 36px rgba(2,6,23,.18);
        overflow:hidden; z-index: 50;
      }
      .sb-dd-row{
        display:flex; align-items:center; gap:12px;
        width:100%; text-align:left;
        background:#fff; border:0; cursor:pointer; padding:10px 12px;
        transition: background .12s ease;
      }
      .sb-dd-row:hover, .sb-dd-row.active{ background:#f3f4f6; }
      .sb-dd-row.muted{ color:#6b7280; cursor:default; }
      .sb-thumb{ width:44px; height:34px; border-radius:8px; overflow:hidden; border:1px solid #e5e7eb; background:#f8fafc; display:grid; place-items:center; }
      .sb-thumb img{ width:100%; height:100%; object-fit:cover; }
      .sb-name{ font-weight:800; color:#0f172a; font-size:14px; }
    `}</style>
  );
}

