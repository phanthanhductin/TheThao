// src/pages/Customers/Wishlist.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HeartButton from "../../components/HeartButton";
import { getWishlistIds, clearWishlist } from "../../utils/wishlist";

const API = "http://127.0.0.1:8000/api";
const PLACEHOLDER = "https://placehold.co/300x200?text=No+Image";

// Chuẩn hoá payload: [], {data:[...]}, {data:{data:[...]}}
function toList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

export default function WishlistPage({ addToCart }) {
  const [ids, setIds] = useState(getWishlistIds());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lắng nghe thay đổi wishlist
  useEffect(() => {
    const onChange = () => setIds(getWishlistIds());
    window.addEventListener("wishlist-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("wishlist-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  // Tải danh sách
  useEffect(() => {
    let cancelled = false;

    async function fetchBulk() {
      const url = `${API}/products?ids=${ids.join(",")}&per_page=${ids.length}`;
      const res = await fetch(url);
      const json = await res.json();
      const list = toList(json);
      const map = new Map(list.map((p) => [Number(p.id || p.product_id), p]));
      return ids.map((pid) => map.get(Number(pid))).filter(Boolean);
    }

    async function fetchOneByOne() {
      const reqs = ids.map((id) =>
        fetch(`${API}/products/${id}`).then((r) => (r.ok ? r.json() : null))
      );
      const rs = await Promise.all(reqs);
      return rs.filter(Boolean);
    }

    (async () => {
      setLoading(true);
      try {
        if (!ids.length) {
          setItems([]);
          return;
        }
        let data = [];
        try {
          data = await fetchBulk();
        } catch {}
        if ((!data || data.length === 0) && ids.length > 0) {
          data = await fetchOneByOne();
        }
        if (!cancelled) setItems(data);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ids]);

  const count = ids.length;

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "60px 20px 100px",
        fontFamily: "Montserrat, sans-serif",
        position: "relative",
        overflow: "hidden",
        // 🌸 pastel rất nhẹ
        background:
          "radial-gradient(1000px 360px at 15% 0%, #fff0f7 0%, rgba(255,240,247,0) 70%), radial-gradient(900px 320px at 85% 8%, #ffe9f5 0%, rgba(255,233,245,0) 70%), linear-gradient(180deg,#fff7fb 0%, #ffffff 65%)",
      }}
    >
      {/* Icons động */}
      <FloatingDecor />

      {/* Header */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto 36px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "linear-gradient(90deg,#ec4899,#8b5cf6,#06b6d4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          💗 Danh sách yêu thích
          <span style={{ opacity: 0.6, fontWeight: 700 }}>({count})</span>
        </h1>

        {count > 0 && (
          <button
            onClick={() => {
              clearWishlist();
              setIds([]);
              setItems([]);
            }}
            style={{
              background: "linear-gradient(90deg,#ec4899,#f43f5e)",
              color: "#fff",
              border: "none",
              padding: "8px 14px",
              borderRadius: 20,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(236,72,153,.25)",
              transition: "filter .2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
          >
            🗑️ Xóa hết
          </button>
        )}
      </div>

      {/* States */}
      {loading ? (
        <p style={{ textAlign: "center", color: "#f472b6" }}>Đang tải danh sách…</p>
      ) : count === 0 ? (
        <p style={{ textAlign: "center", color: "#444" }}>
          Chưa có sản phẩm nào trong yêu thích.{" "}
          <Link to="/products" style={{ color: "#ec4899", fontWeight: 700 }}>
            Xem sản phẩm →
          </Link>
        </p>
      ) : (
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            // 👇 lưới luôn căn giữa
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 260px))",
            justifyContent: "center",
            gap: 24,
            position: "relative",
            zIndex: 2,
          }}
        >
          {items.map((p) => {
            const id = p.id || p.product_id;
            const thumb =
              p.thumbnail_url || p.thumbnail || p.image || PLACEHOLDER;
            const root = Number(p.price_root || 0);
            const sale = Number(p.price_sale || p.price || 0);
            const off =
              root > 0 && sale < root
                ? Math.round(((root - sale) / root) * 100)
                : 0;

            return (
              <div
                key={id}
                style={{
                  background: "#fff",
                  borderRadius: 20,
                  boxShadow: "0 10px 24px rgba(17,24,39,.08)",
                  overflow: "hidden",
                  position: "relative",
                  transition: "transform .25s, box-shadow .25s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow =
                    "0 14px 30px rgba(17,24,39,.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 24px rgba(17,24,39,.08)";
                }}
              >
                {/* Badge giảm giá */}
                {off > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      background: "#f97316",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 800,
                      padding: "4px 8px",
                      borderRadius: 12,
                      zIndex: 2,
                    }}
                  >
                    -{off}%
                  </div>
                )}

                {/* Tim */}
                <div style={{ position: "absolute", top: 12, right: 12, zIndex: 2 }}>
                  <HeartButton
                    productId={id}
                    onToggle={() => setIds(getWishlistIds())}
                  />
                </div>

                {/* Ảnh */}
                <img
                  src={thumb}
                  alt={p.name}
                  onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                  style={{
                    width: "100%",
                    height: 180,
                    objectFit: "cover",
                    borderBottom: "1px solid #f3f4f6",
                  }}
                />

                {/* Thông tin */}
                <div style={{ padding: "12px 16px" }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 15,
                      minHeight: 40,
                      marginBottom: 8,
                      color: "#111",
                    }}
                  >
                    {p.name}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 4 }}>
                    {p.brand_name || "Không rõ"}
                  </div>
                  <div style={{ fontWeight: 900, color: "#ec4899", fontSize: 15 }}>
                    {sale.toLocaleString()} đ{" "}
                    {root > 0 && sale < root && (
                      <span
                        style={{
                          color: "#9ca3af",
                          textDecoration: "line-through",
                          marginLeft: 6,
                          fontSize: 13,
                        }}
                      >
                        {root.toLocaleString()} đ
                      </span>
                    )}
                  </div>

                  {/* Nút giỏ (nếu cần) */}
                  {typeof addToCart === "function" && (
                    <div style={{ textAlign: "center", marginTop: 10 }}>
                      <button
                        onClick={() => addToCart(p)}
                        style={{
                          background:
                            "linear-gradient(90deg,#ec4899,#a855f7,#06b6d4)",
                          color: "#fff",
                          border: "none",
                          padding: "8px 14px",
                          borderRadius: 20,
                          cursor: "pointer",
                          transition: "filter .2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.filter = "brightness(1.15)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.filter = "brightness(1)")
                        }
                      >
                        🛒 Thêm vào giỏ
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* 🎈 Icon nền động: mây, trái tim, hoa (SVG inline) */
function FloatingDecor() {
  return (
    <>
      <style>{`
        @keyframes cloud-move {
          0% { transform: translateX(-25%); }
          100% { transform: translateX(125%); }
        }
        @keyframes float-slow {
          0% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0); }
        }
        @keyframes drift {
          0% { transform: translateX(0) translateY(0) rotate(0deg); }
          50% { transform: translateX(10px) translateY(-6px) rotate(5deg); }
          100% { transform: translateX(0) translateY(0) rotate(0deg); }
        }

        .decor { position:absolute; top:0; left:0; width:100%; height:240px; z-index:1; pointer-events:none; }
        .row { position:absolute; left:0; width:100%; display:flex; gap:48px; opacity:.4; }
        .row svg { filter: drop-shadow(0 6px 10px rgba(236,72,153,.12)); }

        /* 2 lớp mây chạy ngang */
        .clouds-1 { top:60px;  animation: cloud-move 42s linear infinite; }
        .clouds-2 { top:120px; animation: cloud-move 55s linear infinite; opacity:.35; }

        /* trái tim bay dọc nhẹ */
        .hearts { top:20px; justify-content:center; gap:24px; }
        .hearts svg { animation: float-slow 4.8s ease-in-out infinite; }

        /* hoa lượn lờ */
        .flowers { top:160px; justify-content:flex-end; gap:28px; opacity:.35; }
        .flowers svg { animation: drift 6.5s ease-in-out infinite; }

        /* size */
        .sm { width:64px; } .md { width:84px; } .lg { width:110px; }
      `}</style>

      <div className="decor">
        {/* Mây lớp 1 */}
        <div className="row clouds-1">
          <Cloud className="sm" />
          <Cloud className="md" />
          <Cloud className="sm" />
          <Cloud className="lg" />
          <Cloud className="md" />
        </div>

        {/* Mây lớp 2 */}
        <div className="row clouds-2">
          <Cloud className="md" />
          <Cloud className="sm" />
          <Cloud className="md" />
          <Cloud className="sm" />
          <Cloud className="md" />
        </div>

        {/* Trái tim */}
        <div className="row hearts" style={{ top: 10 }}>
          <Heart className="sm" color="#fda4af" />
          <Heart className="sm" color="#fb7185" />
          <Heart className="sm" color="#f9a8d4" />
        </div>

        {/* Hoa */}
        <div className="row flowers">
          <Flower className="sm" />
          <Flower className="md" />
        </div>
      </div>
    </>
  );
}

function Cloud({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="#ffffff">
      <circle cx="18" cy="18" r="10" />
      <circle cx="28" cy="14" r="8" />
      <circle cx="38" cy="19" r="9" />
      <rect x="14" y="18" width="30" height="8" rx="4" />
    </svg>
  );
}
function Heart({ className = "", color = "#f472b6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={color}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function Flower({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 64 64">
      <g transform="translate(32,32)">
        <circle r="6" fill="#fda4af" />
        {[0, 72, 144, 216, 288].map((deg, i) => (
          <circle
            key={i}
            cx={Math.cos((deg * Math.PI) / 180) * 12}
            cy={Math.sin((deg * Math.PI) / 180) * 12}
            r="8"
            fill="#fbcfe8"
          />
        ))}
      </g>
    </svg>
  );
}
