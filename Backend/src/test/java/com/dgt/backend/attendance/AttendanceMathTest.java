package com.dgt.backend.attendance;
import org.junit.jupiter.api.Test;
import java.time.*;
import java.math.BigDecimal;
import static org.assertj.core.api.Assertions.assertThat;
class AttendanceMathTest {
 @Test void clipsOvernightAtSundayAndUsesElapsedTimeThroughDst(){
  ZoneId zone=ZoneId.of("America/New_York");
  Instant lower=LocalDate.of(2026,11,1).atStartOfDay(zone).toInstant(),upper=LocalDate.of(2026,11,8).atStartOfDay(zone).toInstant();
  assertThat(AttendanceMath.seconds(Instant.parse("2026-11-01T03:00:00Z"),Instant.parse("2026-11-01T08:00:00Z"),lower,upper)).isEqualTo(14400);
  assertThat(AttendanceMath.seconds(lower,null,lower,upper)).isZero();
  assertThat(AttendanceMath.sunday(LocalDate.of(2026,11,7))).isEqualTo(LocalDate.of(2026,11,1));
 }
 @Test void overtimeSplitsCrossingShiftAndDoesNotRoundEachMinute(){
  assertThat(AttendanceMath.overtime(39*3600,3*3600,new BigDecimal("40"))).isEqualTo(2*3600);
  assertThat(AttendanceMath.overtime(42*3600,3600,new BigDecimal("40"))).isEqualTo(3600);
  assertThat(AttendanceMath.hours(60*7)).isEqualByComparingTo("0.12");
 }
}
