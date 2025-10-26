import { NavLink } from "react-router-dom";

const linkStyle = ({ isActive }) => ({
  display: "block",
  padding: "12px 16px",
  textDecoration: "none",
  color: isActive ? "#34eff6ff" : "#e0e0e0",
  background: isActive ? "rgba(0,230,118,0.15)" : "transparent",
  borderRadius: 8,
  marginBottom: 6,
  fontWeight: 600,
  transition: "all 0.2s",
  outline: "none",
  // thanh nhấn nhá khi active
  boxShadow: isActive ? "inset 2px 0 0 #34eff6ff" : "none",
});

export default function AdminSidebar() {
  return (
    <aside
      style={{
        padding: 16,
        background: "#121212",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#110defff",
          textTransform: "uppercase",
          letterSpacing: 1,
          textShadow: "0 0 6px rgba(3, 46, 237, 0.6)",
          padding: "4px 0 8px",
        }}
      >
        Admin
      </div>

      {/* Navigation */}
      <nav
        style={{
          overflowY: "auto",
          paddingRight: 4,
          flex: 1,
        }}
      >
        <NavLink to="/admin" end style={linkStyle} title="Tổng quan">
          Dashboard
        </NavLink>

        <NavLink to="/admin/products" style={linkStyle} title="Quản lý sản phẩm">
          Quản Lý Sản Phẩm
        </NavLink>

        <NavLink to="/admin/categories" style={linkStyle} title="Quản lý danh mục">
          Quản Lý Danh Mục
        </NavLink>

        <NavLink to="/admin/orders" style={linkStyle} title="Quản lý đơn hàng">
          Quản Lý Đơn Hàng
        </NavLink>

        <NavLink to="/admin/posts" style={linkStyle} title="Quản lý bài viết">
          Quản Lý Bài Viết
        </NavLink>

        <NavLink to="/admin/contacts" style={linkStyle} title="Quản lý liên hệ">
          Quản Lý Liên Hệ
        </NavLink>

        <NavLink to="/admin/stock-movements" style={linkStyle} title="Nhập/Xuất/Kiểm kê kho">
          Quản Lý Tồn Kho
        </NavLink>

        {/* ✅ Mục mới: Mã giảm giá */}
        <NavLink to="/admin/coupons" style={linkStyle} title="Tạo và quản lý mã giảm giá">
          Quản Lý Mã Giảm Giá
        </NavLink>
      </nav>

      {/* Footer nho nhỏ */}
      <div
        style={{
          fontSize: 12,
          color: "#9e9e9e",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingTop: 8,
        }}
      >
        v1.0 • TheThao Admin
      </div>
    </aside>
  );
}
