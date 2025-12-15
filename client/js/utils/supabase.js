import { createClient } from '@supabase/supabase-js'

// Lấy biến từ môi trường (thay vì điền trực tiếp chuỗi string)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
