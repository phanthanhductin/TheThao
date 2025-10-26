// src/pages/Customers/QuickViewModal.jsx
import { useEffect, useRef, useState } from "react";

export default function QuickViewModal({ productId, open, onClose, onAdd }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [variant, setVariant] = useState(null);
  const [activeImg, setActiveImg] = useState(null);
  const [error, setError] = useState("");
  const dlgRef = useRef(null);

  // lock body scroll khi mở modal
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => (document.body.style.overflow = prev);
    }
  }, [open]);

  // fetch dữ liệu
  useEffect(() => {
    if (!open || !productId) return;
    let abort = new AbortController();
    setLoading(true);
    setError("");
    setVariant(null);
    setActiveImg(null);

    fetch(`/api/products/${productId}/quick`, { signal: abort.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Không tải được dữ liệu sản phẩm");
        return r.json();
      })
      .then((json) => {
        setData(json);
        const first =
          (Array.isArray(json?.images) && json.images[0]) ||
          json?.thumbnail_url ||
          "";
        setActiveImg(first || null);
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(e.message || "Lỗi không xác định");
      })
      .finally(() => setLoading(false));

    return () => abort.abort();
  }, [open, productId]);

  // Esc để đóng
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  const price = (v) => Intl.NumberFormat("vi-VN").format(v || 0) + "₫";

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/55 backdrop-blur-sm"
      onMouseDown={handleOverlay}
      aria-modal="true"
      role="dialog"
      aria-labelledby="qv-title"
    >
      <div
        ref={dlgRef}
        className="w-full max-w-4xl mx-3 sm:mx-6 bg-white rounded-2xl shadow-2xl overflow-hidden
                   ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b">
          <h3 id="qv-title" className="text-base sm:text-lg font-semibold line-clamp-1">
            {data?.name || "Xem nhanh"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border hover:bg-slate-50 active:scale-95 transition"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col md:flex-row">
          {/* Left: images */}
          <div className="md:w-1/2 p-4 sm:p-5">
            {loading ? (
              <div className="h-64 sm:h-72 bg-slate-100 rounded-xl animate-pulse" />
            ) : error ? (
              <div className="h-64 sm:h-72 bg-rose-50 border border-rose-200 rounded-xl
                              text-rose-700 flex items-center justify-center text-sm">
                {error}
              </div>
            ) : (
              <>
                <div className="relative">
                  <img
                    src={activeImg || data?.thumbnail_url}
                    alt={data?.name}
                    className="w-full h-64 sm:h-72 object-cover rounded-xl select-none"
                    onError={(e) => (e.currentTarget.style.opacity = 0)}
                  />
                  <span className="absolute bottom-2 right-2 text-[11px] px-2 py-0.5 rounded-full bg-black/50 text-white">
                    Hover để phóng to
                  </span>
                </div>

                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {[...(data?.images || []), data?.thumbnail_url]
                    .filter(Boolean)
                    .slice(0, 8)
                    .map((u, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(u)}
                        className={`shrink-0 w-14 h-14 rounded-lg border overflow-hidden
                                    ${activeImg === u ? "border-indigo-600" : "border-slate-200"}`}
                        aria-label={`Ảnh ${i + 1}`}
                      >
                        <img src={u} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                </div>
              </>
            )}
          </div>

          {/* Right: info */}
          <div className="md:w-1/2 p-5 sm:p-6 border-t md:border-t-0 md:border-l">
            <div className="flex items-baseline gap-2">
              <div className="text-rose-600 text-xl sm:text-2xl font-bold">
                {price(data?.price)}
              </div>
              {data?.price_root > 0 && data?.price_root !== data?.price && (
                <div className="text-slate-400 line-through text-sm sm:text-base">
                  {price(data?.price_root)}
                </div>
              )}
            </div>
            <div className="mt-1 text-xs sm:text-sm">
              {data?.in_stock ? (
                <span className="text-emerald-600">Còn hàng</span>
              ) : (
                <span className="text-rose-600">Hết hàng</span>
              )}
            </div>

            <div className="mt-4">
              <div className="text-sm font-medium mb-1">Chọn biến thể</div>
              <div className="flex flex-wrap gap-2">
                {(data?.variants || []).map((v) => {
                  const active = variant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      disabled={v.stock <= 0}
                      onClick={() => setVariant(v)}
                      className={`px-3 py-1.5 rounded-full border text-sm transition
                                  focus:outline-none focus:ring-2 focus:ring-indigo-500
                                  ${active ? "border-indigo-600 bg-indigo-50" : "border-slate-300 bg-white"}
                                  ${v.stock <= 0 ? "opacity-45 cursor-not-allowed" : "hover:border-indigo-400"}`}
                    >
                      {v.size || v.color || "Variant"}{v.stock <= 0 ? " (Hết)" : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                disabled={!variant || variant?.stock <= 0 || loading}
                onClick={() => onAdd?.(data, variant)}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300
                           text-white px-4 py-2 rounded-xl shadow-sm active:scale-95 transition"
              >
                Thêm vào giỏ
              </button>
              <a
                href={`/product/${data?.id}`}
                className="px-4 py-2 rounded-xl border hover:bg-slate-50 active:scale-95 transition text-center"
              >
                Xem chi tiết
              </a>
            </div>

            {(data?.rating_avg || data?.rating_count) && (
              <div className="mt-3 text-xs text-slate-500">
                ⭐ {data?.rating_avg ?? 0}/5 • {data?.rating_count ?? 0} đánh giá
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
