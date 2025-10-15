// src/components/HeartButton.jsx
import { useEffect, useState } from "react";
import { isLiked, toggleWishlist } from "../utils/wishlist";

export default function HeartButton({
  productId,
  onToggle,
  className = "",
  size = 22,
  outlineColor = "#ffffff", // viền khi chưa like
  fillColor = "#ff4d6d",    // màu khi like
}) {
  // giữ state local để re-render ngay
  const [liked, setLiked] = useState(() => isLiked(productId));
  const [hovered, setHovered] = useState(false);

  // đổi productId thì đồng bộ lại trạng thái
  useEffect(() => {
    setLiked(isLiked(productId));
  }, [productId]);

  // đồng bộ khi danh sách yêu thích đổi từ nơi khác
  useEffect(() => {
    const sync = () => setLiked(isLiked(productId));
    window.addEventListener("wishlist-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("wishlist-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, [productId]);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newLiked = toggleWishlist(productId); // cập nhật localStorage + phát event
    setLiked(newLiked);                         // cập nhật UI ngay lập tức
    onToggle?.(newLiked);
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={liked ? "Bỏ yêu thích" : "Thêm yêu thích"}
      aria-label="Yêu thích"
      aria-pressed={liked}
      className={`hb-btn ${liked ? "liked" : ""} ${className || ""}`}
      style={{
        // bỏ nền tròn & viền
        background: "transparent",
        border: "none",
        padding: 0,
        margin: 0,

        // canh giữa icon
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",

        // hiệu ứng mượt
        cursor: "pointer",
        transform: hovered ? "scale(1.1)" : "scale(1)",
        transition: "transform 160ms ease",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={`hb-icon ${liked ? "is-liked" : ""}`}
        style={{
          // bóng nhẹ để nhìn rõ trên ảnh sáng
          filter: "drop-shadow(0 1px 2px rgba(0,0,0,.3))",
          transition: "fill 160ms ease, stroke 160ms ease",
        }}
        fill={liked ? fillColor : "none"}
        stroke={liked ? fillColor : outlineColor}
        strokeWidth="2"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
      </svg>

      {/* CSS cho heartbeat */}
      <style>{`
        .hb-btn:active { transform: scale(.96); }
        .hb-icon.is-liked {
          animation: hb-beat .45s ease;
          transform-origin: center;
        }
        @keyframes hb-beat {
          0% { transform: scale(1); }
          28% { transform: scale(1.25); }
          60% { transform: scale(.92); }
          100% { transform: scale(1); }
        }
      `}</style>
    </button>
  );
}
