package com.dgt.backend.access.dto;

import java.util.*;

/** Request fields for ProfileController; JSON field names remain unchanged. */
public record ChangePasswordRequest(String currentPassword,String newPassword,String confirmPassword){}
