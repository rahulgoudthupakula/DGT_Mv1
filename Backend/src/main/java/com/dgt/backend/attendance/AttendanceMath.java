package com.dgt.backend.attendance;
import java.time.*;
import java.math.*;
/** Attendance arithmetic uses elapsed seconds, clips reporting boundaries and rounds only totals. */
public final class AttendanceMath {
 private AttendanceMath(){}
 public static LocalDate sunday(LocalDate date){return date.minusDays(date.getDayOfWeek().getValue()%7);}
 public static long seconds(Instant start,Instant end,Instant lower,Instant upper){if(end==null)return 0;Instant a=start.isAfter(lower)?start:lower,b=end.isBefore(upper)?end:upper;return b.isAfter(a)?Duration.between(a,b).getSeconds():0;}
 public static BigDecimal hours(long seconds){return BigDecimal.valueOf(seconds).divide(BigDecimal.valueOf(3600),2,RoundingMode.HALF_UP);}
 public static long overtime(long previous,long worked,BigDecimal threshold){long limit=threshold.multiply(BigDecimal.valueOf(3600)).longValueExact();return Math.max(0,previous+worked-limit)-Math.max(0,previous-limit);}
}
