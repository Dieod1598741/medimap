const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function migrate() {
    console.log('Fetching products from medi-sand.vercel.app...');
    const response = await fetch('https://medi-sand.vercel.app/data/products.json');
    const products = await response.json();
    console.log(`Found ${products.length} products.`);

    console.log('Fetching ALL current medicines from Supabase for merging...');
    let allExisting = [];
    let from = 0;
    const fetchBatchSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('medicines')
            .select('*')
            .range(from, from + fetchBatchSize - 1);

        if (error) {
            console.error('Error fetching existing medicines:', error.message);
            return;
        }
        if (!data || data.length === 0) break;
        allExisting = [...allExisting, ...data];
        if (data.length < fetchBatchSize) break;
        from += fetchBatchSize;
    }

    const nameToMed = new Map();
    allExisting.forEach(m => {
        nameToMed.set(m.name, m);
    });

    console.log(`Mapped ${nameToMed.size} existing medicines.`);

    // De-duplicate products from JSON by name
    const uniqueProductsMap = new Map();
    products.forEach(p => {
        if (!uniqueProductsMap.has(p.name)) {
            uniqueProductsMap.set(p.name, p);
        }
    });
    const uniqueProducts = Array.from(uniqueProductsMap.values());
    console.log(`De-duplicated to ${uniqueProducts.length} unique products.`);

    const updates = uniqueProducts.map(p => {
        const existing = nameToMed.get(p.name);
        return {
            id: existing ? existing.id : undefined,
            name: p.name,
            barcode: p.barcode,
            vendor: p.vendor,
            category: p.category || (existing ? existing.category : null),
            location: existing ? existing.location : '미지정',
            is_in_stock: existing ? existing.is_in_stock : true,
            stock_quantity: existing ? existing.stock_quantity : 0,
            internal_notes: existing ? existing.internal_notes : null,
            image_url: existing ? existing.image_url : null
        };
    });

    const batchSize = 100;
    console.log(`Starting upsert in batches of ${batchSize}...`);
    for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        console.log(`Upserting batch ${Math.floor(i / batchSize) + 1}...`);

        const { error: upsertError } = await supabase
            .from('medicines')
            .upsert(batch);

        if (upsertError) {
            console.error(`Error in batch ${i / batchSize + 1}:`, upsertError.message);
            // If it's the ID issue again, try inserting without ID if it doesn't exist
        }
    }

    console.log('Enrichment/Migration complete.');
}

migrate().catch(console.error);
