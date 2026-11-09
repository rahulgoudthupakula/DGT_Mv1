package com.dgt.backend.access.dto;

import java.util.*;

/** Request fields for ProfileController; JSON field names remain unchanged. */
public record UpdateProfileRequest(String firstName,String lastName,String email,String currentPassword){}
