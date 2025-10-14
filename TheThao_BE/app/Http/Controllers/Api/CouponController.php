<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    /**
     * GET /api/coupons?product_id=...
     * Trả về danh sách coupon áp dụng cho sản phẩm (tạm thời rỗng để tránh 404).
     * Sau này có thể gắn logic đọc DB theo product_id, category_id, v.v.
     */
    public function index(Request $request)
    {
        $productId = $request->query('product_id');
        // TODO: nếu triển khai thật sự, truy vấn DB theo $productId để tìm coupon áp dụng
        // Ví dụ định dạng trả về:
        // [
        //   ['code' => 'SALE10', 'title' => 'Giảm 10%', 'discount_type' => 'percent', 'value' => 10],
        // ]
        return response()->json(['data' => []], 200);
    }

    /**
     * (Tuỳ chọn) POST /api/coupons/validate
     * body: { code, product_id?, subtotal? }
     * => Trả về hợp lệ/không và giá trị giảm. Hiện để stub.
     */
    public function validateCode(Request $request)
    {
        $code = (string) $request->input('code', '');
        // TODO: kiểm tra code trong DB, ngày hiệu lực, điều kiện đơn hàng, v.v.
        return response()->json([
            'valid'   => false,
            'message' => 'Chưa triển khai kiểm tra mã giảm giá.',
        ], 200);
    }
}
