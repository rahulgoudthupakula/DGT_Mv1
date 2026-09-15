package com.dgt.backend.identity.database;

public final class AuthenticationDatabase {
    private AuthenticationDatabase() {}
    public static final String BY_EMAIL = "SELECT user_id,email,password_hash,account_status,two_factor_authentication FROM public.users WHERE email=?";
}
