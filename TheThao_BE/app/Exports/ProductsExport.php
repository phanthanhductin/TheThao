<?php

namespace App\Exports;

use App\Models\Product;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ProductsExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        return Product::select(
            'name',
            'slug',
            'category_id as category',
            'brand_id',
            'price_root',
            'price_sale',
            'stock',
            'status',
            'thumbnail',
            'description',
            'detail'
        )->get();
    }

    public function headings(): array
    {
        return [
            'name',
            'slug',
            'category',
            'brand_id',
            'price_root',
            'price_sale',
            'stock',
            'status',
            'thumbnail',
            'description',
            'detail'
        ];
    }
}
