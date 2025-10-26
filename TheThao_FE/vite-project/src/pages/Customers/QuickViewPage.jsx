// src/pages/Customers/QuickViewPage.jsx
import { useParams, useNavigate } from "react-router-dom";
import QuickViewModal from "./QuickViewModal.jsx";

export default function QuickViewPage() {
  const { id } = useParams();
  const nav = useNavigate();

  return (
    <QuickViewModal
      productId={id}
      open={true}
      onClose={() => nav(-1)} // Đóng modal → quay lại trang trước
      onAdd={(prod, variant) => {
        // Phát event để App nhận và thêm vào giỏ (không đụng logic hiện có)
        window.dispatchEvent(
          new CustomEvent("qv:add", { detail: { prod, variant } })
        );
      }}
    />
  );
}
