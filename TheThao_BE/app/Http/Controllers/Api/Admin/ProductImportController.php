<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\ProductsImport;

class ProductImportController extends Controller
{
    public function import(Request $request)
    {
        $data = $request->validate([
            'file' => 'required|file|mimes:xlsx,csv,xls',
            'mode' => 'nullable|in:upsert,create-only,update-only',
        ]);

        $mode = $data['mode'] ?? 'upsert';

        try {
            $import = new ProductsImport($mode);
            Excel::import($import, $data['file']);

            return response()->json([
                'message'  => 'Import hoàn tất',
                'inserted' => $import->inserted,
                'updated'  => $import->updated,
                'skipped'  => $import->skipped,
                'errors'   => $import->errors,
            ]);
        } catch (\Throwable $e) {
            \Log::error('[IMPORT ERROR] ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Import thất bại',
                'error'   => $e->getMessage(),
                'trace'   => config('app.debug') ? $e->getTraceAsString() : null,
            ], 500);
        }
    }
}
