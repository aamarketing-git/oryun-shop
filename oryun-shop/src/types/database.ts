// 이 파일은 Supabase 마이그레이션 후 자동 생성됩니다:
//   pnpm db:types
// (실제로는: supabase gen types typescript --project-id $YOUR_PROJECT > src/types/database.ts)
//
// 아래는 빌드 통과용 최소 정의입니다. 운영에서는 위 명령어로 갱신하세요.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
    };
    Views: { [key: string]: { Row: any } };
    Functions: { [key: string]: { Args: any; Returns: any } };
    Enums: { [key: string]: string };
    CompositeTypes: { [key: string]: any };
  };
}
