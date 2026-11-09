package com.dgt.backend.access.dto;

import java.util.*;

/** Request fields for AccessController; JSON field names remain unchanged. */
public record NewUserGrant(long moduleId,boolean view,boolean edit){}
