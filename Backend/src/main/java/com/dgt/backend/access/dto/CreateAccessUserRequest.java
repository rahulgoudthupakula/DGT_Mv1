package com.dgt.backend.access.dto;

import java.util.*;

/** Request fields for AccessController; JSON field names remain unchanged. */
public record CreateAccessUserRequest(String firstName,String lastName,String employeeId,String email,String password,long roleTypeId,List<String> stores,List<NewUserGrant> modules){}
