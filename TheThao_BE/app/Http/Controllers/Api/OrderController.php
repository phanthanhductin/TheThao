<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage; 

class OrderController extends Controller
{
    /* =====================================================
     *  Helper: Tạo URL ảnh tuyệt đối
     * ===================================================== */
    private function makeThumbUrl(?string $path): ?string
    {
        if (!$path) return null;

        // Đã là absolute URL
        if (preg_match('~^https?://~i', $path)) {
            return $path;
        }

        // Đã là đường dẫn /storage/... => dùng luôn
        if (str_starts_with($path, '/storage/')) {
            return url($path);
        }

        // Nếu path bắt đầu "public/" thì bỏ "public/" rồi dùng Storage::url
        $clean = ltrim($path, '/');
        if (str_starts_with($clean, 'public/')) {
            $clean = substr($clean, 7); // cắt "public/"
        }

        // Chuẩn hoá thành /storage/xxx (yêu cầu đã chạy php artisan storage:link)
        return url(Storage::url($clean));
    }

    /* =====================================================
     *  ĐẶT HÀNG (TRỪ TỒN KHO)
     * ===================================================== */
    public function checkout(Request $request)
    {
        $data = $request->validate([
            'customer_name'   => 'required|string|max:100',
            'phone'           => 'required|string|max:20',
            'address'         => 'required|string|max:255',
            'email'           => 'required|email|max:255',
            'items'           => 'required|array|min:1',
            'items.*.id'      => 'required|integer',     // product_id
            'items.*.name'    => 'required|string',
            'items.*.price'   => 'required|numeric',
            'items.*.qty'     => 'required|integer|min:1',
        ]);

        return DB::transaction(function () use ($data) {
            // 1️⃣ Tạo đơn hàng mới (pending)
            $order = Order::create([
                'name'     => $data['customer_name'],
                'phone'    => $data['phone'],
                'email'    => $data['email'],
                'address'  => $data['address'],
                'user_id'  => Auth::id() ?? null,
                'status'   => 0, // pending
                'note'     => null,
            ]);

            $total = 0;

            // 2️⃣ Duyệt từng sản phẩm: kiểm tra, trừ kho, ghi log, thêm chi tiết
            foreach ($data['items'] as $item) {
                $buyQty = (int) $item['qty'];
                $product = Product::lockForUpdate()->find($item['id']);

                if (!$product) {
                    throw new \Exception("Sản phẩm ID {$item['id']} không tồn tại");
                }

                $stock = (int) ($product->qty ?? 0);
                if ($stock < $buyQty) {
                    throw new \Exception("Sản phẩm '{$product->name}' chỉ còn {$stock}");
                }

                $price = (float) $item['price'];

                // ✅ Trừ kho
                $product->decrement('qty', $buyQty);

                // ✅ Ghi log xuất kho
                StockMovement::create([
                    'product_id' => $product->id,
                    'type'       => 'export',
                    'qty_change' => -$buyQty,
                    'ref_type'   => 'order',
                    'ref_id'     => $order->id,
                    'note'       => 'Trừ kho khi đặt hàng',
                    'created_by' => Auth::id() ?? null,
                ]);

                // ✅ Ghi chi tiết đơn hàng
                OrderDetail::create([
                    'order_id'   => $order->id,
                    'product_id' => $product->id,
                    'price_buy'  => $price,
                    'qty'        => $buyQty,
                    'amount'     => $price * $buyQty,
                ]);

                $total += $price * $buyQty;
            }

            // 3️⃣ Cập nhật ghi chú (bỏ qua cột total nếu DB không có)
            try {
                $table = (new Order)->getTable();
                if (Schema::hasColumn($table, 'total')) {
                    $order->update([
                        'total' => $total,
                        'note'  => "Tổng đơn: {$total} đ",
                    ]);
                } else {
                    $order->update([
                        'note'  => "Tổng đơn: {$total} đ",
                    ]);
                }
            } catch (\Throwable $e) {
                $order->update(['note' => "Tổng đơn: {$total} đ"]);
            }

            return response()->json([
                'message'  => 'Đặt hàng thành công',
                'order_id' => $order->id,
                'total'    => $total,
            ], 201);
        });
    }

    public function mine(\Illuminate\Http\Request $request)
    {
        // Yêu cầu đã đăng nhập (vì routes /orders/mine đang nằm trong middleware 'auth:sanctum')
        $user = \Illuminate\Support\Facades\Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Lấy danh sách đơn của user, kèm chi tiết + tổng tiền tính từ chi tiết
        $orders = \App\Models\Order::query()
            ->where('user_id', $user->id)
            ->with(['details.product'])
            ->withSum('details as computed_total', 'amount')
            ->orderByDesc('created_at')
            ->get();

        // Chuẩn hóa dữ liệu trả về cho FE
        $data = $orders->map(function ($order) {
            $items = $order->details->map(function ($d) {
                $p = $d->product;
                return [
                    'product_id' => $d->product_id,
                    'name'       => $p->name ?? null,
                    'thumbnail'  => $p?->thumbnail_url ?? $p?->thumbnail ?? null,
                    'price'      => (float) $d->price_buy,
                    'qty'        => (int) $d->qty,
                    'subtotal'   => isset($d->amount)
                                    ? (float) $d->amount
                                    : ((float)$d->price_buy * (int)$d->qty),
                ];
            })->values();

            $total = $order->computed_total ?? $items->sum(fn($it) => $it['subtotal']);

            return [
                'id'         => $order->id,
                'code'       => (string)($order->code ?? $order->id),
                'name'       => $order->name,
                'email'      => $order->email,
                'phone'      => $order->phone,
                'address'    => $order->address,
                'note'       => $order->note,
                'status'     => (int)($order->status ?? 0),
                'total'      => (float)$total,
                'created_at' => optional($order->created_at)->toDateTimeString(),
                'items'      => $items,
            ];
        });

        return response()->json(['data' => $data]);
    }

    /* =====================================================
     *  LẤY DANH SÁCH ĐƠN HÀNG
     * ===================================================== */
    public function index(Request $request)
    {
        $search  = trim((string) $request->query('search', ''));
        $perPage = max(1, min(100, (int)$request->query('per_page', 20)));
        $status  = $request->has('status') ? $request->integer('status') : null;

        $q = Order::query()
            ->withCount('details')
            ->withSum('details as computed_total', 'amount');

        if (!is_null($status)) {
            $q->where('status', $status);
        }

        if ($search !== '') {
            $q->where(function ($qq) use ($search) {
                $qq->where('name', 'like', "%{$search}%")
                   ->orWhere('phone', 'like', "%{$search}%")
                   ->orWhere('email', 'like', "%{$search}%")
                   ->orWhere('id', $search);
            });
        }

        $orders = $q->latest('id')->paginate($perPage);

        $orders->getCollection()->transform(function ($o) {
            $o->total = (float) ($o->total ?? $o->computed_total ?? 0);
            return $o;
        });

        return response()->json($orders);
    }

    public function adminIndex(Request $request)
    {
        return $this->index($request);
    }

    /* =====================================================
     *  XEM CHI TIẾT ĐƠN HÀNG
     * ===================================================== */
    public function show($id)
    {
        $order = Order::with(['details.product:id,name,thumbnail'])
            ->withSum('details as computed_total', 'amount')
            ->find($id);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $items = $order->details->map(function ($d) {
            $p = $d->product;

            // ✅ ưu tiên thumbnail_url, rồi tới thumbnail / image
            $rawImg = $p?->thumbnail_url ?? $p?->thumbnail ?? $p?->image ?? null;
            $img = $this->makeThumbUrl($rawImg);

            return [
                'id'            => $d->id,
                'product_id'    => $d->product_id,
                'name'          => $p?->name ?? 'Sản phẩm',
                'price'         => (float) $d->price_buy,
                'qty'           => (int) $d->qty,
                'subtotal'      => (float) ($d->amount ?? $d->price_buy * $d->qty),
                'thumbnail_url' => $img, // FE đang đọc trường này
            ];
        });

        $total = (float)(
            $order->total
            ?? $order->computed_total
            ?? $items->sum(fn($it) => $it['subtotal'])
        );

        return response()->json([
            'id'         => $order->id,
            'code'       => (string)($order->code ?? $order->id),
            'name'       => $order->name,
            'email'      => $order->email,
            'phone'      => $order->phone,
            'address'    => $order->address,
            'note'       => $order->note,
            'status'     => (int)($order->status ?? 0),
            'total'      => $total,
            'created_at' => $order->created_at,
            'updated_at' => $order->updated_at,
            'items'      => $items,
        ]);
    }

    /* =====================================================
     *  CẬP NHẬT ĐƠN HÀNG (ĐỔI TRẠNG THÁI / GHI CHÚ)
     *  PUT /api/admin/orders/{id}
     *  Body JSON: { "status": 0|1|2|3|4|5, "note": "..." }
     * ===================================================== */
 public function update(Request $request, $id)
{
    // Validate "note" như bình thường; status tự parse để tránh 422
    $data = $request->validate([
        'note' => 'sometimes|nullable|string|max:1000',
    ]);

    return DB::transaction(function () use ($id, $data, $request) {
        /** @var \App\Models\Order|null $order */
        $order = Order::with('details')->lockForUpdate()->find($id);
        if (!$order) {
            return response()->json(['message' => 'Không tìm thấy đơn hàng'], 404);
        }

        $oldStatus = (int)($order->status ?? 0);
        $newStatus = $oldStatus;

        // Chỉ xử lý khi FE gửi status (có thể là số hoặc chữ)
        if ($request->filled('status')) {
            $raw = trim((string)$request->input('status'));

            // Map chuỗi → mã số (chấp nhận EN/VN, có/không dấu)
            $map = [
                'pending' => 0, 'chờ xác nhận' => 0, 'cho xac nhan' => 0, 'cho duyet' => 0, 'chờ duyệt' => 0,
                'confirmed' => 1, 'đã xác nhận' => 1, 'da xac nhan' => 1, 'xac nhan' => 1,
                'ready' => 2, 'chờ giao hàng' => 2, 'cho giao hang' => 2, 'đóng gói' => 2, 'dong goi' => 2, 'san sang' => 2,
                'shipping' => 3, 'đang giao' => 3, 'dang giao' => 3, 'van chuyen' => 3, 'vận chuyển' => 3,
                'delivered' => 4, 'đã giao' => 4, 'da giao' => 4, 'hoan tat' => 4, 'hoàn tất' => 4,
                'canceled' => 5, 'cancelled' => 5, 'cancel' => 5, 'hủy' => 5, 'huy' => 5,
            ];

            // Chuẩn hoá key so sánh (lowercase, bỏ dấu cơ bản)
            $key = mb_strtolower($raw, 'UTF-8');
            // Bỏ dấu đơn giản
            $key_noaccent = iconv('UTF-8', 'ASCII//TRANSLIT', $key);
            $key_noaccent = $key_noaccent ? strtolower($key_noaccent) : $key;

            if (array_key_exists($key, $map)) {
                $newStatus = (int)$map[$key];
            } elseif (array_key_exists($key_noaccent, $map)) {
                $newStatus = (int)$map[$key_noaccent];
            } else {
                // Thử parse số
                $num = filter_var($raw, FILTER_VALIDATE_INT);
                if ($num === false) {
                    return response()->json([
                        'message' => 'Giá trị status không hợp lệ. Chỉ nhận 0..5 hoặc pending/confirmed/ready/shipping/delivered/canceled.',
                        'errors'  => ['status' => ['Status phải là 0..5 hoặc nhãn hợp lệ']],
                    ], 422);
                }
                $newStatus = (int)$num;
            }

            if ($newStatus < 0 || $newStatus > 5) {
                return response()->json([
                    'message' => 'Giá trị status không hợp lệ. Chỉ nhận 0..5.',
                    'errors'  => ['status' => ['Status phải nằm trong khoảng 0..5']],
                ], 422);
            }
        }

        // Không cho sửa khi đã giao (4) hoặc đã hủy (5)
        if (in_array($oldStatus, [4, 5], true)) {
            return response()->json(['message' => 'Đơn đã hoàn tất hoặc hủy, không thể cập nhật.'], 400);
        }

        // Nếu chuyển sang hủy (5) → hoàn tồn kho
        if ($newStatus === 5 && $oldStatus !== 5) {
            return $this->cancel($id);
        }

        // Cập nhật trạng thái / ghi chú
        $order->status = $newStatus;
        if (array_key_exists('note', $data)) {
            $order->note = $data['note'];
        }
        $order->save();

        // Build items giống show()
        $order->load(['details.product:id,name,thumbnail']);
        $items = $order->details->map(function ($d) {
            $p = $d->product;
            $rawImg = $p?->thumbnail_url ?? $p?->thumbnail ?? $p?->image ?? null;
            $img = $this->makeThumbUrl($rawImg);
            return [
                'id'            => $d->id,
                'product_id'    => $d->product_id,
                'name'          => $p?->name ?? 'Sản phẩm',
                'price'         => (float)$d->price_buy,
                'qty'           => (int)$d->qty,
                'subtotal'      => (float)($d->amount ?? $d->price_buy * $d->qty),
                'thumbnail_url' => $img,
            ];
        });

        $total = (float)(
            $order->total
            ?? $order->details->sum('amount')
            ?? $order->details->sum(fn($d) => (float)$d->price_buy * (int)$d->qty)
        );

        // Trả về dạng có "data" để FE dùng updated.data.status
        return response()->json([
            'message' => 'Cập nhật trạng thái thành công.',
            'data' => [
                'id'         => $order->id,
                'code'       => (string)($order->code ?? $order->id),
                'name'       => $order->name,
                'email'      => $order->email,
                'phone'      => $order->phone,
                'address'    => $order->address,
                'note'       => $order->note,
                'status'     => (int)($order->status ?? 0),
                'total'      => $total,
                'created_at' => $order->created_at,
                'updated_at' => $order->updated_at,
                'items'      => $items,
            ],
        ]);
    });
}


    /* =====================================================
     *  THEO DÕI ĐƠN HÀNG (MÃ + SĐT)
     * ===================================================== */
    public function track(Request $request)
    {
        $code  = trim((string) $request->query('code', ''));
        $phone = trim((string) $request->query('phone', ''));

        if ($code === '' && $phone === '') {
            return response()->json(['message' => 'Thiếu code hoặc phone'], 422);
        }

        $q = Order::query()
            ->with(['details.product:id,thumbnail,name'])
            ->withSum('details as computed_total', 'amount');

        if ($phone !== '') $q->where('phone', $phone);

        if ($code !== '') {
            if (ctype_digit($code)) {
                $q->where('id', (int)$code);
            } else {
                $table = (new Order)->getTable();
                if (Schema::hasColumn($table, 'code')) {
                    $q->where('code', $code);
                }
            }
        }

        $order = $q->latest('id')->first();
        if (!$order) return response()->json(['message' => 'Không tìm thấy đơn hàng'], 404);

        return $this->show($order->id);
    }

    /* =====================================================
     *  HỦY ĐƠN (HOÀN TỒN KHO)
     * ===================================================== */
    public function cancel($id)
    {
        return DB::transaction(function () use ($id) {
            $order = Order::with('details')->lockForUpdate()->find($id);
            if (!$order) {
                return response()->json(['message' => 'Không tìm thấy đơn hàng'], 404);
            }

            if (in_array($order->status, [4, 5])) {
                return response()->json(['message' => 'Đơn hàng này không thể hủy.'], 400);
            }

            foreach ($order->details as $d) {
                Product::where('id', $d->product_id)->increment('qty', $d->qty);

                StockMovement::create([
                    'product_id' => $d->product_id,
                    'type'       => 'return',
                    'qty_change' => (int)$d->qty,
                    'ref_type'   => 'order_cancel',
                    'ref_id'     => $order->id,
                    'note'       => 'Hoàn kho khi hủy đơn',
                    'created_by' => Auth::id() ?? null,
                ]);
            }

            $order->status = 5; // canceled
            $order->save();

            return response()->json([
                'message' => 'Đơn hàng đã được hủy và hoàn tồn kho!',
                'data' => $order
            ]);
        });
    }
}
