package com.dgt.backend.common.database;

public record Column(String name,String type,boolean nullable,boolean hasDefault,boolean readOnly,
                     int maxLength,int precision,int scale) {}
