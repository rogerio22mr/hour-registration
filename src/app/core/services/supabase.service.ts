import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, AuthResponse } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly client: SupabaseClient = createClient(
    environment.supabase.url,
    environment.supabase.anonKey,
  );

  get auth() {
    return this.client.auth;
  }

  from(table: string) {
    return this.client.from(table);
  }

  signInWithPassword(email: string, password: string): Promise<AuthResponse> {
    return this.client.auth.signInWithPassword({ email, password });
  }

  signOut(): Promise<{ error: unknown }> {
    return this.client.auth.signOut();
  }
}
