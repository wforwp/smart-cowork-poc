import { createClient } from '@supabase/supabase-js';

// Supabase 프로젝트 설정에서 복사한 전체 URL을 입력해야 합니다.
const supabaseUrl = 'https://ubnawkuwedatwbcuuyos.supabase.co';
const supabaseAnonKey = 'sb_publishable_b7QwSoS0YVGxU6mpn5dDnw_icBn7VlJ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
