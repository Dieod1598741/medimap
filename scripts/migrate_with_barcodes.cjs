const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function migrate() {
    console.log('Fetching products from medi-sand.vercel.app...');
    const response = await fetch('https://medi-sand.vercel.app/data/products.json');
    const products = await response.json();
    console.log(`Found ${products.length} products.`);

    const batchSize = 100;
    for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize).map(p => ({
            name: p.name,
            category: p.category,
            barcode: p.barcode,
            vendor: p.vendor,
            location: '미지정', // Default location
            is_in_stock: true,
            stock_quantity: 0
        }));

        console.log(`Upserting batch ${i / batchSize + 1}...`);
        // We use upsert on name to avoid duplicates and update barcodes
        const { error } = await supabase
            .from('medicines')
            .upsert(batch, { onConflict: 'name' });

        if (error) {
            console.error(`Error in batch ${i / batchSize + 1}:`, error.message);
        }
    }

    console.log('Migration complete.');
}

migrate().catch(console.error);
