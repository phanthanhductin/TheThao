// src/utils/wishlist.js
export const API = "http://127.0.0.1:8000/api";
const KEY = "wishlist_ids";

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function write(ids) {
  localStorage.setItem(KEY, JSON.stringify(ids));
  // phát sự kiện để các trang khác (Header/Wishlist) cập nhật
  window.dispatchEvent(new CustomEvent("wishlist-changed", { detail: ids.length }));
}

export function getWishlistIds() {
  return read();
}

export function isLiked(id) {
  const pid = Number(id);
  return read().includes(pid);
}

export function toggleWishlist(id) {
  const pid = Number(id);
  const ids = read();
  const i = ids.indexOf(pid);
  let liked = false;

  if (i >= 0) {
    ids.splice(i, 1);
    liked = false;
  } else {
    ids.unshift(pid);
    liked = true;
  }
  write(ids);

  // đồng bộ server nếu có token
  const token = localStorage.getItem("token");
  if (token) {
    fetch(`${API}/wishlist/toggle/${pid}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    }).catch(() => {});
  }

  return liked;
}

export function clearWishlist() {
  write([]); // rỗng + phát sự kiện
}
