// src/components/ProductCard.jsx
import { Link } from "react-router-dom";
import HeartButton from "./HeartButton";

const PLACEHOLDER = "https://placehold.co/300x200?text=No+Image";

export default function ProductCard({ p }) {
  const root = Number(p.price_root || 0);
  const sale = Number(p.price_sale || p.price || 0);
  const off = root > 0 && sale < root ? Math.round(((root - sale) / root) * 100) : 0;
  const imgSrc = p.thumbnail_url || p.thumbnail || PLACEHOLDER;

  return (
    <div
      className="product-card"
      style={styles.card}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = styles.card.boxShadow;
      }}
    >
      {/* Badge giảm giá */}
      {off > 0 && <div style={styles.saleTag}>-{off}%</div>}

      {/* Nút trái tim */}
      <div className="heart-wrapper" style={styles.heartWrapper}>
        <HeartButton productId={p.id} />
      </div>

      {/* ✅ Ảnh + thông tin */}
      <Link
        to={`/products/${p.id}`}
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        <div style={styles.imageWrap}>
          <img
            src={imgSrc}
            alt={p.name}
            style={styles.image}
            onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
          />
        </div>

        <div style={styles.info}>
          <div style={styles.name}>{p.name}</div>
          <div style={styles.brand}>{p.brand_name || "Không rõ"}</div>
          <div style={styles.priceBox}>
            <span style={styles.priceSale}>{sale.toLocaleString()} đ</span>
            {root > sale && (
              <span style={styles.priceRoot}>{root.toLocaleString()} đ</span>
            )}
          </div>
        </div>
      </Link>

      <style>{`
        .product-card:hover .heart-wrapper {
          transform: scale(1.1);
        }
        .heart-wrapper svg {
          width: 22px;
          height: 22px;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
        }
      `}</style>
    </div>
  );
}

/* ======= Styles ======= */
const styles = {
  card: {
    position: "relative",
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    overflow: "hidden",
    textAlign: "center",
    transition: "all 0.25s ease",
    cursor: "pointer",
  },
  imageWrap: {
    position: "relative",
    width: "100%",
    background: "#f9fafb",
    overflow: "hidden",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  image: {
    width: "100%",
    height: 160,
    objectFit: "cover",
    display: "block",
  },
  /* 👇 Tim căn chỉnh chuẩn pixel */
  heartWrapper: {
    position: "absolute",
    top: 14, // cách đều 14px so với top
    right: 14, // cách đều 14px so với mép phải
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.25s ease",
  },
  saleTag: {
    position: "absolute",
    top: 14,
    left: 14,
    background: "#f97316",
    color: "#fff",
    fontSize: 12,
    fontWeight: 800,
    borderRadius: 12,
    padding: "4px 8px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    zIndex: 9,
  },
  info: {
    padding: "12px 14px 16px",
  },
  name: {
    fontWeight: 700,
    fontSize: 15,
    color: "#111827",
    lineHeight: 1.4,
    minHeight: 38,
    overflow: "hidden",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 2,
  },
  brand: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 4,
  },
  priceBox: {
    marginTop: 6,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  priceSale: {
    color: "#ec4899",
    fontWeight: 800,
    fontSize: 15,
  },
  priceRoot: {
    color: "#9ca3af",
    textDecoration: "line-through",
    fontSize: 13,
  },
};
