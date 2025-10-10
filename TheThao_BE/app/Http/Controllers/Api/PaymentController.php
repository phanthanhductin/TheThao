<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;
use App\Models\Order;
use App\Models\Payment; // nếu chưa có bảng ptdt_payment thì vẫn giữ; bên dưới đã có guard

class PaymentController extends Controller
{
    // POST /api/payments/momo/create
    public function createMoMo(Request $req)
    {
        try {
            $amount = (int) $req->input('amount', 0);
            if ($amount <= 0) {
                return response()->json(['message' => 'Số tiền không hợp lệ'], 422);
            }

            $partnerCode = config('momo.partnerCode');
            $accessKey   = config('momo.accessKey');
            $secretKey   = config('momo.secretKey');
            $endpoint    = rtrim(config('momo.endpoint', 'https://test-payment.momo.vn'), '/');
            $redirectUrl = config('momo.returnUrl');
            $ipnUrl      = config('momo.ipnUrl');

            if (!$partnerCode || !$accessKey || !$secretKey || !$redirectUrl || !$ipnUrl) {
                Log::error('MoMo config missing', compact('partnerCode','accessKey','secretKey','redirectUrl','ipnUrl'));
                return response()->json(['message' => 'Thiếu cấu hình MoMo (.env)'], 500);
            }

            // loại thanh toán: 'qr' (captureWallet) | 'card' (payWithMethod)
            $typeFromFE  = $req->input('momo_type', 'qr');
            $requestType = $typeFromFE === 'card' ? 'payWithMethod' : 'captureWallet';

            // ⛑️ user_id an toàn (KHÔNG để null)
            $userId = optional($req->user())->id ?? 0;

            // Tạo Order pending
            $payloadCreate = [
                'name'           => $req->input('name'),
                'phone'          => $req->input('phone'),
                'email'          => $req->input('email'),
                'address'        => $req->input('address'),
                'user_id'        => $userId,
                'status'         => 0,
                'note'           => $req->input('note'),
                'payment_method' => 'momo',
                'payment_status' => 'pending',
            ];
            if (Schema::hasColumn('ptdt_order', 'total')) {
                $payloadCreate['total'] = $amount;
            }
            if (Schema::hasColumn('ptdt_order', 'created_by')) {
                $payloadCreate['created_by'] = $userId;
            }
            if (Schema::hasColumn('ptdt_order', 'updated_by')) {
                $payloadCreate['updated_by'] = $userId;
            }

            $order = Order::create($payloadCreate);

            // Ký yêu cầu
            $orderId   = 'ORD' . $order->id . '-' . time();
            $requestId = (string) Str::uuid();
            $orderInfo = 'Thanh toan don hang #' . $order->id;
            $extraData = base64_encode(json_encode(['order_id' => $order->id]));

            $raw = "accessKey={$accessKey}&amount={$amount}&extraData={$extraData}&ipnUrl={$ipnUrl}"
                 . "&orderId={$orderId}&orderInfo={$orderInfo}&partnerCode={$partnerCode}"
                 . "&redirectUrl={$redirectUrl}&requestId={$requestId}&requestType={$requestType}";
            $signature = hash_hmac('sha256', $raw, $secretKey);

            $payload = [
                'partnerCode' => $partnerCode,
                'partnerName' => 'TheThao Sports',
                'storeId'     => 'TheThao_FE',
                'requestId'   => $requestId,
                'amount'      => $amount,
                'orderId'     => $orderId,
                'orderInfo'   => $orderInfo,
                'redirectUrl' => $redirectUrl,
                'ipnUrl'      => $ipnUrl,
                'lang'        => 'vi',
                'extraData'   => $extraData,
                'requestType' => $requestType,
                'signature'   => $signature,
            ];

            $client = Http::timeout(20);
            if (env('MOMO_SSL_VERIFY', 'true') === 'false') $client = $client->withoutVerifying();
            $res = $client->post("{$endpoint}/v2/gateway/api/create", $payload);

            if (!$res->ok()) {
                Log::error('MoMo create failed', ['status' => $res->status(), 'body' => $res->body()]);
                return response()->json(['message' => 'MoMo create failed', 'detail' => $res->json() ?? $res->body()], 500);
            }
            $json = $res->json();

            // Lưu giao dịch (pending) nếu có bảng ptdt_payment
            if (class_exists(Payment::class) && Schema::hasTable('ptdt_payment')) {
                try {
                    Payment::create([
                        'order_id'   => $order->id,
                        'provider'   => 'momo',
                        'method'     => $requestType,
                        'status'     => 'pending',
                        'amount'     => $amount,
                        'request_id' => $requestId,
                        'order_code' => $orderId,
                        'pay_url'    => $json['payUrl'] ?? null,
                        'extra'      => ['order_id' => $order->id, 'momo_type' => $typeFromFE],
                    ]);
                } catch (\Throwable $e) {
                    Log::warning('Payment row not created', ['err' => $e->getMessage()]);
                }
            }

            // Lưu amount cho đối soát
            $order->payment_amount = $amount;
            $order->save();

            return response()->json([
                'ok'       => true,
                'momo'     => $json,
                'order_id' => $order->id,
                'orderId'  => $orderId,
            ]);
        } catch (\Throwable $e) {
            Log::error('MoMo create exception', ['err' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'MoMo exception: '.$e->getMessage()], 500);
        }
    }

    // (ipn/check/return giữ nguyên như bạn đã gửi)
    public function ipn(Request $req)
    {
        Log::info('MoMo IPN HIT', $req->all());
        // ... giữ nguyên code ipn của bạn ...
        // (không đổi gì vì phần này đang ổn)
        $partnerCode  = $req->input('partnerCode');
        $orderId      = $req->input('orderId');
        $requestId    = $req->input('requestId');
        $amount       = $req->input('amount');
        $orderInfo    = $req->input('orderInfo');
        $orderType    = $req->input('orderType');
        $transId      = $req->input('transId');
        $resultCode   = (int) $req->input('resultCode');
        $message      = $req->input('message');
        $payType      = $req->input('payType');
        $responseTime = $req->input('responseTime');
        $extraData    = $req->input('extraData');
        $signature    = $req->input('signature');

        $accessKey = config('momo.accessKey');
        $secretKey = config('momo.secretKey');

        $raw = "accessKey={$accessKey}&amount={$amount}&extraData={$extraData}&message={$message}"
             . "&orderId={$orderId}&orderInfo={$orderInfo}&orderType={$orderType}&partnerCode={$partnerCode}"
             . "&payType={$payType}&requestId={$requestId}&responseTime={$responseTime}"
             . "&resultCode={$resultCode}&transId={$transId}";
        $mySig = hash_hmac('sha256', $raw, $secretKey);

        if ($mySig !== $signature) {
            Log::warning('MoMo IPN invalid signature', ['orderId' => $orderId]);
            return response('', 204);
        }

        $data  = json_decode(base64_decode($extraData), true);
        $oid   = $data['order_id'] ?? 0;
        $order = Order::find($oid);
        if (!$order) {
            Log::warning('MoMo IPN order not found', ['oid' => $oid]);
            return response('', 204);
        }

        if ($resultCode === 0) {
            $order->payment_status = 'paid';
            $order->payment_ref    = (string) $transId;
            $order->payment_at     = now();
            $order->status         = 1; // tuỳ hệ thống
        } else {
            $order->payment_status = 'failed';
        }
        $order->save();

        if (class_exists(Payment::class) && Schema::hasTable('ptdt_payment')) {
            $payment = Payment::where('request_id', $requestId)
                        ->orWhere('order_code', $orderId)
                        ->orWhere('order_id', $order->id)
                        ->latest()->first();

            if (!$payment) {
                $payment = new Payment();
                $payment->order_id   = $order->id;
                $payment->provider   = 'momo';
                $payment->request_id = $requestId;
                $payment->order_code = $orderId;
                $payment->amount     = (int) $amount;
            }
            $payment->trans_id    = $transId;
            $payment->result_code = $resultCode;
            $payment->message     = $message;
            $payment->ipn_payload = $req->all();
            $payment->status      = $resultCode === 0 ? 'paid' : 'failed';
            if ($resultCode === 0 && !$payment->paid_at) $payment->paid_at = now();
            $payment->save();
        }

        return response('', 204);
    }

    public function check(Request $req)
    {
        // ... giữ nguyên như bạn đã gửi ...
        $orderCode = $req->query('order_code');
        if (!$orderCode) {
            return response()->json(['ok' => false, 'message' => 'Missing order_code'], 422);
        }

        $payment = (class_exists(Payment::class) && Schema::hasTable('ptdt_payment'))
            ? Payment::where('order_code', $orderCode)->latest()->first()
            : null;

        $order = $payment && $payment->order_id ? Order::find($payment->order_id) : null;

        return response()->json([
            'ok'             => true,
            'payment_status' => $payment->status ?? null,
            'result_code'    => $payment->result_code ?? null,
            'order_status'   => $order->payment_status ?? null,
            'order_id'       => $order->id ?? null,
        ]);
    }

    public function return(Request $req)
    {
        return response()->json([
            'resultCode' => (int) $req->input('resultCode'),
            'orderId'    => $req->input('orderId'),
            'message'    => $req->input('message'),
        ]);
    }
}
//     |--------------------------------------------------------------------------