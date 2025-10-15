// src/pages/Admin/Category/add.jsx
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Editor } from "@tinymce/tinymce-react";

const API_BASE = "http://127.0.0.1:8000/api";

export default function AddCategory() {
  const navigate = useNavigate();
  const editorRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "", // sẽ lưu HTML từ TinyMCE
    sort_order: "",
    parent_id: "",
    image: "",
    status: 1,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "name" && !form.slug) {
      const s = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setForm((prev) => ({ ...prev, slug: s }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Lấy HTML từ TinyMCE (nếu có)
      const descHtml =
        editorRef.current?.getContent({ format: "html" }) ?? form.description ?? "";

      const payload = {
        name: form.name,
        slug: form.slug || form.name,
        description: descHtml, // gửi HTML giàu định dạng
        sort_order: form.sort_order === "" ? 0 : Number(form.sort_order),
        parent_id: form.parent_id === "" ? null : Number(form.parent_id),
        image: form.image || null,
        status: Number(form.status),
      };

      const token = localStorage.getItem("admin_token") || "";
      if (!token) throw new Error("Bạn chưa đăng nhập admin (thiếu token).");

      const res = await fetch(`${API_BASE}/admin/categories`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let message = `Thêm thất bại (HTTP ${res.status})`;
        try {
          const errData = await res.json();
          if (errData?.errors) {
            const msgs = Object.values(errData.errors).flat().join("\n");
            message = msgs || errData.message || message;
          } else if (errData?.message) {
            message = errData.message;
          }
        } catch {
          const txt = await res.text();
          if (txt) console.error("Server error:", txt);
        }
        throw new Error(message);
      }

      const data = await res.json();
      alert(data.message || "Thêm danh mục thành công!");
      navigate("/admin/categories");
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi thêm danh mục.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ padding: 20 }}>
      <div
        style={{
          background: "white",
          borderRadius: 12,
          padding: 20,
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          maxWidth: 980,
          margin: "0 auto",
        }}
      >
        <h1 style={{ fontSize: 24, marginBottom: 16, fontWeight: 700 }}>
          Thêm danh mục
        </h1>

        {error && (
          <p className="whitespace-pre-line" style={{ color: "red", marginBottom: 12 }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          {/* Lưới 2 cột giống các form khác */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              alignItems: "start",
            }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <span>Tên danh mục</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                style={{
                  height: 36,
                  padding: "0 10px",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Slug (tùy chọn)</span>
              <input
                name="slug"
                value={form.slug}
                onChange={handleChange}
                style={{
                  height: 36,
                  padding: "0 10px",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Thứ tự hiển thị (mặc định 0)</span>
              <input
                type="number"
                name="sort_order"
                value={form.sort_order}
                onChange={handleChange}
                style={{
                  height: 36,
                  padding: "0 10px",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Parent ID (nếu có)</span>
              <input
                type="number"
                name="parent_id"
                value={form.parent_id}
                onChange={handleChange}
                style={{
                  height: 36,
                  padding: "0 10px",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Ảnh (đường dẫn / tên file)</span>
              <input
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder="VD: categories/football.png"
                style={{
                  height: 36,
                  padding: "0 10px",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Trạng thái</span>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                style={{
                  height: 36,
                  padding: "0 10px",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}
              >
                <option value={1}>Hiển thị</option>
                <option value={0}>Nháp</option>
              </select>
            </label>
          </div>

          {/* MÔ TẢ (Rich Text, tối ưu dán từ Word) */}
          <label style={{ display: "grid", gap: 6 }}>
            <span>Mô tả (hỗ trợ dán từ Word)</span>

            <Editor
              // Nếu bạn có API key Tiny, dùng: tinymceScriptSrc="https://cdn.tiny.cloud/1/<API_KEY>/tinymce/6/tinymce.min.js"
              // Nếu không, TinyMCE sẽ được bundle từ package 'tinymce' đã cài.
              onInit={(_evt, editor) => (editorRef.current = editor)}
              initialValue={form.description || ""}
              onEditorChange={(content) =>
                setForm((prev) => ({ ...prev, description: content }))
              }
              init={{
                height: 360,
                menubar: false,
                branding: false,
                plugins: "lists link table code image autoresize paste",
                toolbar:
                  "undo redo | blocks | bold italic underline forecolor | " +
                  "alignleft aligncenter alignright alignjustify | " +
                  "bullist numlist outdent indent | table link | removeformat | code",
                // Tối ưu dán từ Word
                paste_as_text: false, // giữ lại format cơ bản
                paste_data_images: false, // chặn dán ảnh base64 (giảm payload)
                paste_enable_default_filters: true,
                paste_word_valid_elements:
                  "b,strong,i,em,u,a[href|target],p,br,ul,ol,li,table,thead,tbody,tr,td,th,span[style],h1,h2,h3,h4,h5,h6",
                paste_convert_word_fake_lists: true,
                // Giới hạn style giữ lại
                valid_elements:
                  "a[href|target=_blank],strong/b,em/i,u,br,p,ul,ol,li,table,thead,tbody,tr,td[colspan|rowspan],th[colspan|rowspan],h1,h2,h3,h4,h5,h6,span[style]",
                content_style:
                  "body{font-family:Montserrat,system-ui,-apple-system,Segoe UI,Roboto; font-size:14px; color:#0f172a;} p{margin:0 0 8px;} table{border-collapse:collapse;width:100%;} td,th{border:1px solid #ddd;padding:6px;}",
                // Tự động mở rộng chiều cao theo nội dung
                autoresize_bottom_margin: 16,
              }}
            />
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => navigate("/admin/categories")}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #999",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              Hủy
            </button>
            <button
              disabled={loading}
              type="submit"
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #0f62fe",
                background: "#0f62fe",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              {loading ? "Đang lưu…" : "Lưu danh mục"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
