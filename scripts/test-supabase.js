const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'YOUR_SUPABASE_KEY';

console.log('Testing connection to:', SUPABASE_URL);
console.log('Using key:', SUPABASE_KEY);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
  try {
    // Try to fetch a non-existent table just to check if the connection is established
    // or fetch a public table if we knew one. 
    // Usually 'from' doesn't throw until we await the result.
    // We can try to get the health check or just a simple query.
    
    // Let's try to list users or just check if we can talk to the API.
    // Since we don't know the schema, we'll try to select from a common table 'users' or 'vocabulary_sets'.
    // Even if the table doesn't exist or we don't have permission, we should get a response from the server (e.g. 404 or 401),
    // which confirms the connection parameters are pointing to a valid Supabase instance.
    
    const { data, error } = await supabase.from('vocabulary_sets').select('count', { count: 'exact', head: true });

    if (error) {
      console.log('Connection established, but received error (this is expected if RLS blocks access or table missing):');
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      console.log('✅ Connection to Supabase endpoint successful (API responded).');
    } else {
      console.log('✅ Connection successful! Data retrieved.');
    }

  } catch (err) {
    console.error('❌ Connection failed with exception:', err.message);
  }
}

testConnection();
