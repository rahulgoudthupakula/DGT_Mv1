package com.dgt.backend.access.dto;

import java.util.*;
import com.fasterxml.jackson.annotation.JsonProperty;

/** Request fields for ProfileSessionController; JSON field names remain unchanged. */
public record RefreshSessionRequest(@JsonProperty("refreshToken") String refreshToken) {}
