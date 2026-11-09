package com.dgt.backend.pos.security;
import java.util.UUID;
// Authenticated connector ID and its database-bound store; this is not an employee principal.
public record PosIdentity(UUID id,String store) {}
