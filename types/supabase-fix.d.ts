// Type overrides for Supabase auth-js to fix TypeScript issues

declare module '@supabase/supabase-js' {
  interface SupabaseAuthClient {
    // Ensure admin APIs and auth helpers are typed for our client usage
    admin?: {
      listUsers?(options?: { page?: number; perPage?: number }): Promise<{ data?: unknown; error?: unknown }>;
      signOut?(jwt: string, scope?: string): Promise<{ error?: unknown }>;
    };
  }
}

// Global type declarations to fix 'unref' on 'never' issues
declare global {
  interface Timer {
    unref?(): void;
  }

  // Fix for Node.js Timer types
  interface NodeJS {
    Timer: any;
  }
}

// Fix for setInterval/setTimeout return types
declare function setInterval(callback: (...args: any[]) => void, ms?: number, ...args: any[]): any;
declare function setTimeout(callback: (...args: any[]) => void, ms?: number, ...args: any[]): any;