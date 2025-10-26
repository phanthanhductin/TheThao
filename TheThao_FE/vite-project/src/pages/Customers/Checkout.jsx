// import { useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";

// const API_BASE = "http://127.0.0.1:8000";

// export default function Checkout({ setCart }) {
//   const navigate = useNavigate();
//   const location = useLocation();

//   // ✅ nhận dữ liệu cart từ Cart.jsx
//   const cart = location.state?.cart || [];

//   const [form, setForm] = useState({
//     customer_name: "",
//     phone: "",
//     email: "",
//     address: "",
//     note: "",
//     payment_method: "MoMo_QR", // COD | Bank | MoMo_QR | MoMo_CARD
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   // ====== COUPON STATE ======
//   const [couponCode, setCouponCode] = useState("");
//   const [couponResult, setCouponResult] = useState({
//     applied: false,
//     discount: 0,
//     message: "",
//     code: "",
//   });

//   // Tính tiền
//   const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
//   const total = Math.max(0, subtotal - (couponResult.discount || 0));

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm((s) => ({ ...s, [name]: value }));
//   };

//   // ====== ÁP MÃ GIẢM GIÁ ======
//   async function applyCoupon() {
//     if (!couponCode.trim()) {
//       return setCouponResult({
//         applied: false,
//         discount: 0,
//         message: "Vui lòng nhập mã.",
//         code: "",
//       });
//     }
//     setCouponResult((s) => ({ ...s, message: "Đang kiểm tra..." }));
//     try {
//       const res = await fetch(`${API_BASE}/api/coupons/validate`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Accept: "application/json",
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//         },
//         body: JSON.stringify({
//           code: couponCode.trim(),
//           subtotal, // gửi tạm tính để BE tính giảm
//         }),
//       });
//       const data = await res.json();
//       if (res.ok && data?.valid) {
//         setCouponResult({
//           applied: true,
//           discount: Number(data.discount || 0),
//           message: `Áp dụng mã ${data.code} thành công.`,
//           code: data.code,
//         });
//       } else {
//         setCouponResult({
//           applied: false,
//           discount: 0,
//           message: data?.message || "Mã không hợp lệ.",
//           code: "",
//         });
//       }
//     } catch (e) {
//       setCouponResult({
//         applied: false,
//         discount: 0,
//         message: "Không thể kiểm tra mã. Thử lại sau.",
//         code: "",
//       });
//     }
//   }

//   async function placeOrderCODorBank() {
//     const res = await fetch(`${API_BASE}/api/checkout`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Accept: "application/json",
//         Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//       },
//       body: JSON.stringify({
//         ...form,
//         items: cart,
//         // gửi kèm cho BE (nếu BE có hỗ trợ)
//         coupon_code: couponResult.applied ? (couponResult.code || couponCode.trim()) : null,
//       }),
//     });

//     const data = await res.json();

//     if (res.ok) {
//       const orderCode =
//         data?.code ||
//         data?.order_code ||
//         data?.order?.code ||
//         data?.order_id ||
//         data?.id;

//       alert("✅ Đặt hàng thành công!" + (orderCode ? " Mã đơn: " + orderCode : ""));
//       if (orderCode) localStorage.setItem("last_order_code", String(orderCode));

//       // xóa giỏ (state + localStorage)
//       setCart([]);
//       localStorage.setItem("cart", "[]");
//       window.dispatchEvent(new Event("cart:clear"));
//       window.dispatchEvent(new CustomEvent("cart-changed", { detail: 0 }));

//       if (orderCode) {
//         navigate(`/track?code=${encodeURIComponent(orderCode)}`, { replace: true });
//       } else {
//         navigate("/track", { replace: true });
//       }
//     } else {
//       throw new Error(data?.message || "Có lỗi xảy ra.");
//     }
//   }

//   async function createMoMoSession() {
//     const momo_type = form.payment_method === "MoMo_CARD" ? "card" : "qr";

//     const res = await fetch(`${API_BASE}/api/payments/momo/create`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Accept: "application/json",
//         Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//       },
//       body: JSON.stringify({
//         name: form.customer_name,
//         phone: form.phone,
//         email: form.email,
//         address: form.address,
//         note: form.note,
//         amount: total, // ✅ gửi tổng sau giảm
//         items: cart,
//         momo_type, // 👈 gửi loại QR/card về BE
//         coupon_code: couponResult.applied ? (couponResult.code || couponCode.trim()) : null, // ✅ gửi mã
//       }),
//     });

//     const data = await res.json();
//     if (!res.ok) throw new Error(data?.message || "Không tạo được phiên thanh toán MoMo.");

//     // 👇 Lưu thông tin để xử lý khi quay về
//     const moOrderCode = data?.momo?.orderId || data?.orderId;
//     const orderId = data?.order_id;
//     if (moOrderCode) localStorage.setItem("momo_last_order_code", moOrderCode);
//     if (orderId) localStorage.setItem("momo_last_order_id", String(orderId));
//     localStorage.setItem("cart_backup", JSON.stringify(cart)); // phòng khi fail thì khôi phục

//     const payUrl = data?.momo?.payUrl || data?.payUrl || data?.momo?.deeplink;
//     if (!payUrl) throw new Error("Thiếu payUrl từ MoMo.");

//     window.location.href = payUrl;
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (cart.length === 0) return setError("Giỏ hàng đang trống.");
//     if (!form.customer_name || !form.phone || !form.email || !form.address)
//       return setError("Vui lòng điền đầy đủ thông tin giao hàng.");

//     setLoading(true);
//     setError("");

//     try {
//       if (form.payment_method.startsWith("MoMo")) {
//         await createMoMoSession(); // ✅ cả QR & Card đều đi lối này
//       } else {
//         await placeOrderCODorBank();
//       }
//     } catch (err) {
//       setError(err?.message || "Không thể kết nối máy chủ.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ maxWidth: 800, margin: "30px auto", padding: 20 }}>
//       <h2 style={{ marginBottom: 20, color: "#388e3c" }}>🧾 Thanh toán</h2>

//       {cart.length === 0 ? (
//         <p>⚠️ Giỏ hàng của bạn đang trống, vui lòng quay lại chọn sản phẩm.</p>
//       ) : (
//         <>
//           {error && (
//             <p
//               style={{
//                 color: "#d32f2f",
//                 background: "#fdecea",
//                 padding: "10px 12px",
//                 borderRadius: 8,
//                 marginBottom: 16,
//               }}
//             >
//               {error}
//             </p>
//           )}

//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "2fr 1fr",
//               gap: 20,
//               alignItems: "flex-start",
//             }}
//           >
//             {/* Form thông tin */}
//             <form
//               onSubmit={handleSubmit}
//               style={{
//                 background: "#fff",
//                 padding: 20,
//                 borderRadius: 12,
//                 boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
//               }}
//             >
//               <h3 style={{ marginBottom: 16 }}>Thông tin khách hàng</h3>

//               <div style={{ marginBottom: 12 }}>
//                 <label>Họ và tên</label>
//                 <input
//                   name="customer_name"
//                   value={form.customer_name}
//                   onChange={handleChange}
//                   required
//                   style={{ width: "100%", padding: 10 }}
//                 />
//               </div>

//               <div style={{ marginBottom: 12 }}>
//                 <label>Số điện thoại</label>
//                 <input
//                   name="phone"
//                   value={form.phone}
//                   onChange={handleChange}
//                   required
//                   style={{ width: "100%", padding: 10 }}
//                 />
//               </div>

//               <div style={{ marginBottom: 12 }}>
//                 <label>Email</label>
//                 <input
//                   type="email"
//                   name="email"
//                   value={form.email}
//                   onChange={handleChange}
//                   required
//                   style={{ width: "100%", padding: 10 }}
//                 />
//               </div>

//               <div style={{ marginBottom: 12 }}>
//                 <label>Địa chỉ giao hàng</label>
//                 <textarea
//                   name="address"
//                   value={form.address}
//                   onChange={handleChange}
//                   required
//                   rows={3}
//                   style={{ width: "100%", padding: 10 }}
//                 />
//               </div>

//               <div style={{ marginBottom: 12 }}>
//                 <label>Ghi chú (tuỳ chọn)</label>
//                 <textarea
//                   name="note"
//                   value={form.note}
//                   onChange={handleChange}
//                   rows={2}
//                   style={{ width: "100%", padding: 10 }}
//                 />
//               </div>

//               <div style={{ marginBottom: 20 }}>
//                 <label>Phương thức thanh toán</label>
//                 <select
//                   name="payment_method"
//                   value={form.payment_method}
//                   onChange={handleChange}
//                   style={{ width: "100%", padding: 10 }}
//                 >
//                   <option value="COD">Thanh toán khi nhận hàng</option>
//                   <option value="MoMo_QR">MoMo (QR)</option>
//                   <option value="MoMo_CARD">MoMo (Thẻ/ATM)</option>
//                 </select>
//                 {form.payment_method.startsWith("MoMo") && (
//                   <p style={{ fontSize: 12, color: "#555", marginTop: 6 }}>
//                     Bạn sẽ được chuyển sang cổng MoMo để thanh toán an toàn.
//                   </p>
//                 )}
//               </div>

//               {/* Ô nhập mã giảm giá */}
//               <div
//                 style={{
//                   marginBottom: 16,
//                   padding: 12,
//                   border: "1px dashed #ddd",
//                   borderRadius: 10,
//                   background: "#fafafa",
//                 }}
//               >
//                 <label style={{ display: "block", marginBottom: 8 }}>
//                   Mã giảm giá
//                 </label>
//                 <div style={{ display: "flex", gap: 8 }}>
//                   <input
//                     placeholder="Nhập mã (VD: ABC10)"
//                     value={couponCode}
//                     onChange={(e) => setCouponCode(e.target.value)}
//                     style={{ flex: 1, padding: 10 }}
//                   />
//                   <button
//                     type="button"
//                     onClick={applyCoupon}
//                     style={{
//                       padding: "10px 14px",
//                       borderRadius: 8,
//                       border: "none",
//                       background: "#4f46e5",
//                       color: "#fff",
//                       fontWeight: 600,
//                       cursor: "pointer",
//                     }}
//                   >
//                     Áp dụng
//                   </button>
//                 </div>
//                 {couponResult.message && (
//                   <p style={{ marginTop: 8, fontSize: 13 }}>{couponResult.message}</p>
//                 )}
//               </div>

//               <button
//                 type="submit"
//                 disabled={loading}
//                 style={{
//                   width: "100%",
//                   padding: "12px 16px",
//                   background: "#388e3c",
//                   color: "#fff",
//                   fontWeight: 600,
//                   fontSize: 16,
//                   border: "none",
//                   borderRadius: 10,
//                   cursor: "pointer",
//                 }}
//               >
//                 {loading
//                   ? "⏳ Đang xử lý..."
//                   : form.payment_method.startsWith("MoMo")
//                   ? "🟣 Thanh toán với MoMo"
//                   : "✅ Xác nhận đặt hàng"}
//               </button>
//             </form>

//             {/* Thông tin giỏ hàng */}
//             <div
//               style={{
//                 background: "#fff",
//                 padding: 20,
//                 borderRadius: 12,
//                 boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
//               }}
//             >
//               <h3 style={{ marginBottom: 16 }}>Đơn hàng của bạn</h3>
//               <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
//                 {cart.map((item) => (
//                   <li
//                     key={item.id}
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       marginBottom: 10,
//                       borderBottom: "1px dashed #eee",
//                       paddingBottom: 6,
//                     }}
//                   >
//                     <span>
//                       {item.name} x {item.qty}
//                     </span>
//                     <span>{(item.price * item.qty).toLocaleString()} đ</span>
//                   </li>
//                 ))}
//               </ul>

//               {/* Tính tiền chi tiết */}
//               <div style={{ marginTop: 12 }}>
//                 <div style={{ display: "flex", justifyContent: "space-between" }}>
//                   <span>Tạm tính</span>
//                   <strong>{subtotal.toLocaleString()} đ</strong>
//                 </div>
//                 <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
//                   <span>Giảm giá {couponResult.applied && couponResult.code ? `(${couponResult.code})` : ""}</span>
//                   <strong>-{(couponResult.discount || 0).toLocaleString()} đ</strong>
//                 </div>
//                 <h3
//                   style={{
//                     marginTop: 12,
//                     color: "#d32f2f",
//                     fontWeight: 700,
//                     fontSize: 18,
//                     textAlign: "right",
//                   }}
//                 >
//                   Tổng cộng: {total.toLocaleString()} đ
//                 </h3>
//               </div>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000";
const VND = new Intl.NumberFormat("vi-VN");

// Fallback mã (dùng khi BE không có/đang lỗi)
const DEMO_COUPONS = [
  { code: "GIAM10K", type: "flat", value: 10000, min_order: 0 },
  { code: "GIAM20K", type: "flat", value: 20000, min_order: 0 },
  { code: "GIAM50K", type: "flat", value: 50000, min_order: 0 },
  { code: "GIAM10",  type: "percent", value: 10, max_discount: 50000, min_order: 100000 },
];

export default function Checkout({ setCart }) {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ nhận dữ liệu cart từ Cart.jsx
  const cart = location.state?.cart || [];

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    address: "",
    note: "",
    payment_method: "MoMo_QR", // COD | Bank | MoMo_QR | MoMo_CARD
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ====== COUPON STATE ======
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState({
    applied: false,
    discount: 0,
    message: "",
    code: "",
  });

  // Danh sách mã để “xổ”; lấy từ BE, rớt thì fallback DEMO_COUPONS
  const [couponList, setCouponList] = useState(DEMO_COUPONS);
  const [showList, setShowList] = useState(false);

  // Tính tiền
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const total = Math.max(0, subtotal - (couponResult.discount || 0));

  const fmt = (n) => VND.format(Number(n || 0));

  // đủ điều kiện theo min_order
  const eligible = (c) => !c?.min_order || subtotal >= Number(c.min_order || 0);

  // 👉 ƯỚC TÍNH GIẢM GIÁ (client) cho 1 mã
  const estimateDiscount = (c) => {
    if (!eligible(c)) return 0;
    const type = c.type || c.discount_type || "flat";
    const val = Number(c.value || c.discount_value || 0);
    if (type === "percent") {
      const maxCap = Number(c.max_discount || Infinity);
      const d = Math.floor((subtotal * val) / 100);
      return Math.min(d, isFinite(maxCap) ? maxCap : d);
    }
    // flat
    return Math.min(val, subtotal); // không vượt quá subtotal
  };

  // 👉 CHỌN MÃ TỐI ƯU: giảm nhiều nhất; hòa thì ưu tiên min_order thấp hơn, sau đó ưu tiên mã có value cao hơn
  const bestCoupon = useMemo(() => {
    if (!couponList || couponList.length === 0) return null;
    const ranked = couponList
      .map((c) => ({ c, saving: estimateDiscount(c) }))
      .filter((x) => x.saving > 0)
      .sort((a, b) => {
        if (b.saving !== a.saving) return b.saving - a.saving;
        const aMin = Number(a.c.min_order || 0);
        const bMin = Number(b.c.min_order || 0);
        if (aMin !== bMin) return aMin - bMin;
        return Number((b.c.value || 0)) - Number((a.c.value || 0));
      });
    return ranked[0] ? { ...ranked[0].c, saving: ranked[0].saving } : null;
  }, [couponList, subtotal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  // 🔎 tải danh sách mã từ BE (nếu có)
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/coupons`);
        if (!r.ok) return; // giữ fallback
        const data = await r.json();
        const list = Array.isArray(data) ? data : data.data ?? [];
        if (!ignore && list.length) setCouponList(list);
      } catch {}
    })();
    return () => { ignore = true; };
  }, []);

  // ====== ÁP MÃ GIẢM GIÁ ======
  async function applyCoupon() {
    if (!couponCode.trim()) {
      return setCouponResult({
        applied: false,
        discount: 0,
        message: "Vui lòng nhập hoặc chọn mã.",
        code: "",
      });
    }
    setCouponResult((s) => ({ ...s, message: "Đang kiểm tra..." }));
    try {
      const res = await fetch(`${API_BASE}/api/coupons/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          code: couponCode.trim(),
          subtotal, // gửi tạm tính để BE tính giảm & kiểm tra điều kiện
        }),
      });
      const data = await res.json();
      if (res.ok && data?.valid) {
        setCouponResult({
          applied: true,
          discount: Number(data.discount || 0),
          message: `Áp dụng mã ${data.code} thành công.`,
          code: data.code,
        });
      } else {
        setCouponResult({
          applied: false,
          discount: 0,
          message: data?.message || "Mã không hợp lệ hoặc không đủ điều kiện.",
          code: "",
        });
      }
    } catch (e) {
      setCouponResult({
        applied: false,
        discount: 0,
        message: "Không thể kiểm tra mã. Thử lại sau.",
        code: "",
      });
    }
  }

  async function placeOrderCODorBank() {
    const res = await fetch(`${API_BASE}/api/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
      body: JSON.stringify({
        ...form,
        items: cart,
        coupon_code: couponResult.applied ? (couponResult.code || couponCode.trim()) : null,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      const orderCode =
        data?.code || data?.order_code || data?.order?.code || data?.order_id || data?.id;

      alert("✅ Đặt hàng thành công!" + (orderCode ? " Mã đơn: " + orderCode : ""));
      if (orderCode) localStorage.setItem("last_order_code", String(orderCode));

      setCart([]);
      localStorage.setItem("cart", "[]");
      window.dispatchEvent(new Event("cart:clear"));
      window.dispatchEvent(new CustomEvent("cart-changed", { detail: 0 }));

      navigate(orderCode ? `/track?code=${encodeURIComponent(orderCode)}` : "/track", { replace: true });
    } else {
      throw new Error(data?.message || "Có lỗi xảy ra.");
    }
  }

  async function createMoMoSession() {
    const momo_type = form.payment_method === "MoMo_CARD" ? "card" : "qr";

    const res = await fetch(`${API_BASE}/api/payments/momo/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
      body: JSON.stringify({
        name: form.customer_name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        note: form.note,
        amount: total, // tổng sau giảm
        items: cart,
        momo_type,
        coupon_code: couponResult.applied ? (couponResult.code || couponCode.trim()) : null,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Không tạo được phiên thanh toán MoMo.");

    const moOrderCode = data?.momo?.orderId || data?.orderId;
    const orderId = data?.order_id;
    if (moOrderCode) localStorage.setItem("momo_last_order_code", moOrderCode);
    if (orderId) localStorage.setItem("momo_last_order_id", String(orderId));
    localStorage.setItem("cart_backup", JSON.stringify(cart));

    const payUrl = data?.momo?.payUrl || data?.payUrl || data?.momo?.deeplink;
    if (!payUrl) throw new Error("Thiếu payUrl từ MoMo.");

    window.location.href = payUrl;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return setError("Giỏ hàng đang trống.");
    if (!form.customer_name || !form.phone || !form.email || !form.address)
      return setError("Vui lòng điền đầy đủ thông tin giao hàng.");

    setLoading(true);
    setError("");

    try {
      if (form.payment_method.startsWith("MoMo")) {
        await createMoMoSession();
      } else {
        await placeOrderCODorBank();
      }
    } catch (err) {
      setError(err?.message || "Không thể kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  // helper UI nhỏ cho chip
  const Chip = ({ children, style }) => (
    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, border: "1px dashed #f9a8d4", background: "#fff1f7", color: "#9d174d", fontWeight: 800, ...style }}>
      {children}
    </span>
  );

  return (
    <div style={{ maxWidth: 800, margin: "30px auto", padding: 20 }}>
      <h2 style={{ marginBottom: 20, color: "#388e3c" }}>🧾 Thanh toán</h2>

      {cart.length === 0 ? (
        <p>⚠️ Giỏ hàng của bạn đang trống, vui lòng quay lại chọn sản phẩm.</p>
      ) : (
        <>
          {error && (
            <p style={{ color: "#d32f2f", background: "#fdecea", padding: "10px 12px", borderRadius: 8, marginBottom: 16 }}>
              {error}
            </p>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, alignItems: "flex-start" }}>
            {/* Form thông tin */}
            <form onSubmit={handleSubmit} style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <h3 style={{ marginBottom: 16 }}>Thông tin khách hàng</h3>

              <div style={{ marginBottom: 12 }}>
                <label>Họ và tên</label>
                <input name="customer_name" value={form.customer_name} onChange={handleChange} required style={{ width: "100%", padding: 10 }} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label>Số điện thoại</label>
                <input name="phone" value={form.phone} onChange={handleChange} required style={{ width: "100%", padding: 10 }} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label>Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required style={{ width: "100%", padding: 10 }} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label>Địa chỉ giao hàng</label>
                <textarea name="address" value={form.address} onChange={handleChange} required rows={3} style={{ width: "100%", padding: 10 }} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label>Ghi chú (tuỳ chọn)</label>
                <textarea name="note" value={form.note} onChange={handleChange} rows={2} style={{ width: "100%", padding: 10 }} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label>Phương thức thanh toán</label>
                <select name="payment_method" value={form.payment_method} onChange={handleChange} style={{ width: "100%", padding: 10 }}>
                  <option value="COD">Thanh toán khi nhận hàng</option>
                  <option value="MoMo_QR">MoMo (QR)</option>
                  <option value="MoMo_CARD">MoMo (Thẻ/ATM)</option>
                </select>
                {form.payment_method.startsWith("MoMo") && (
                  <p style={{ fontSize: 12, color: "#555", marginTop: 6 }}>Bạn sẽ được chuyển sang cổng MoMo để thanh toán an toàn.</p>
                )}
              </div>

              {/* Ô nhập & XỔ mã giảm giá */}
              <div style={{ marginBottom: 16, padding: 12, border: "1px dashed #ddd", borderRadius: 10, background: "#fafafa" }}>
                <label style={{ display: "block", marginBottom: 8 }}>Mã giảm giá</label>

                {/* Gợi ý tốt nhất */}
                {bestCoupon ? (
                  <div style={{ marginBottom: 8, background: "#fff", border: "1px dashed #86efac", borderRadius: 10, padding: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 900, color: "#14532d" }}>
                          🎯 Gợi ý tốt nhất: <Chip>{bestCoupon.code || bestCoupon.coupon_code}</Chip>
                        </div>
                        <div style={{ fontSize: 12, color: "#065f46", marginTop: 4 }}>
                          Ước tính tiết kiệm: <b>{fmt(bestCoupon.saving)}đ</b>
                          {bestCoupon.min_order ? ` • ĐH từ ${fmt(bestCoupon.min_order)}đ` : " • Không điều kiện"}
                          {bestCoupon.type === "percent" && bestCoupon.max_discount ? ` • Tối đa ${fmt(bestCoupon.max_discount)}đ` : ""}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => { 
                          const code = bestCoupon.code || bestCoupon.coupon_code;
                          setCouponCode(code);
                          await new Promise(r => setTimeout(r, 0));
                          applyCoupon();
                        }}
                        style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "#16a34a", color: "#fff", fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}
                        title="Áp dụng đề xuất"
                      >
                        Áp dụng đề xuất
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: 8, fontSize: 12, color: "#6b7280" }}>
                    Hiện chưa có mã nào đủ điều kiện cho đơn {fmt(subtotal)}đ.
                  </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    placeholder="Nhập mã (VD: GIAM10K)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    style={{ flex: 1, padding: 10 }}
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    style={{ padding: "10px 14px", borderRadius: 8, border: "none", background: "#4f46e5", color: "#fff", fontWeight: 600, cursor: "pointer" }}
                  >
                    Áp dụng
                  </button>
                </div>

                {/* Nút xổ danh sách gợi ý */}
                <div style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowList((s) => !s)}
                    style={{ background: "transparent", border: "0", color: "#0ea5e9", cursor: "pointer", fontWeight: 700 }}
                  >
                    {showList ? "Ẩn mã gợi ý ▲" : "Xem tất cả mã phù hợp ▼"}
                  </button>

                  {showList && (
                    <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                      {couponList
                        .map((c) => ({ c, saving: estimateDiscount(c) }))
                        .sort((a, b) => b.saving - a.saving)
                        .map(({ c, saving }) => {
                          const ok = saving > 0;
                          const code = c.code || c.coupon_code || "COUPON";
                          const label =
                            (c.type === "percent" ? `Giảm ${c.value}%` : `Giảm ${fmt(c.value)}đ`) +
                            (c.max_discount ? ` • Tối đa ${fmt(c.max_discount)}đ` : "") +
                            (c.min_order ? ` • ĐH từ ${fmt(c.min_order)}đ` : " • Không điều kiện");
                          return (
                            <button
                              key={code}
                              type="button"
                              disabled={!ok}
                              onClick={() => { setCouponCode(code); setShowList(false); }}
                              title={ok ? `Ước tính tiết kiệm ${fmt(saving)}đ` : `Chưa đủ điều kiện (ĐH từ ${fmt(c.min_order)}đ)`}
                              style={{
                                textAlign: "left",
                                padding: "8px 10px",
                                borderRadius: 10,
                                border: "1px dashed #f9a8d4",
                                background: ok ? "#fff" : "#f3f4f6",
                                color: ok ? "#9d174d" : "#6b7280",
                                cursor: ok ? "pointer" : "not-allowed",
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 10,
                              }}
                            >
                              <span style={{ fontWeight: 800 }}>
                                {code} {ok ? <Chip style={{ marginLeft: 6 }}>~{fmt(saving)}đ</Chip> : null}
                              </span>
                              <span style={{ fontSize: 12 }}>{label}</span>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>

                {couponResult.message && (
                  <p style={{ marginTop: 8, fontSize: 13 }}>{couponResult.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "#388e3c",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 16,
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                {loading
                  ? "⏳ Đang xử lý..."
                  : form.payment_method.startsWith("MoMo")
                  ? "🟣 Thanh toán với MoMo"
                  : "✅ Xác nhận đặt hàng"}
              </button>
            </form>

            {/* Thông tin giỏ hàng */}
            <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <h3 style={{ marginBottom: 16 }}>Đơn hàng của bạn</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {cart.map((item) => (
                  <li key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, borderBottom: "1px dashed #eee", paddingBottom: 6 }}>
                    <span>{item.name} x {item.qty}</span>
                    <span>{(item.price * item.qty).toLocaleString()} đ</span>
                  </li>
                ))}
              </ul>

              {/* Tính tiền chi tiết */}
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Tạm tính</span>
                  <strong>{subtotal.toLocaleString()} đ</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span>Giảm giá {couponResult.applied && couponResult.code ? `(${couponResult.code})` : ""}</span>
                  <strong>-{(couponResult.discount || 0).toLocaleString()} đ</strong>
                </div>
                <h3 style={{ marginTop: 12, color: "#d32f2f", fontWeight: 700, fontSize: 18, textAlign: "right" }}>
                  Tổng cộng: {total.toLocaleString()} đ
                </h3>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
