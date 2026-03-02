const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function updateSchema() {
    console.log('Adding barcode and vendor columns...');
    // Note: This requires the 'execute_sql' RPC to be enabled in Supabase.
    // If it's not enabled, this will fail.
    const { error } = await supabase.rpc('execute_sql', {
        sql: 'ALTER TABLE medicines ADD COLUMN IF NOT EXISTS barcode TEXT, ADD COLUMN IF NOT EXISTS vendor TEXT;'
    });

    if (error) {
        console.error('Error adding columns:', error.message);
        console.log('\n--- Action Required ---');
        console.log('Please run the following SQL in your Supabase SQL Editor:');
        console.log('ALTER TABLE medicines ADD COLUMN IF NOT EXISTS barcode TEXT, ADD COLUMN IF NOT EXISTS vendor TEXT;');
    } else {
        console.log('Successfully updated schema.');
    }
}

updateSchema();
