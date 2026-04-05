import { DateTime } from "luxon";

const BUSINESS_TIME_ZONE =
  process.env.BUSINESS_TIME_ZONE?.trim() || "America/Mexico_City";

export function getBusinessTimeZone() {
  return BUSINESS_TIME_ZONE;
}

export function nowPlusMsInBusinessZone(msToAdd = 0) {
  return DateTime.now().setZone(BUSINESS_TIME_ZONE).plus({ milliseconds: msToAdd });
}

export function todayYmdInBusinessZone() {
  return DateTime.now().setZone(BUSINESS_TIME_ZONE).toFormat("yyyy-LL-dd");
}

export function parseBookingDateTimeMs(dateYmd, timeHm) {
  const date = String(dateYmd || "").trim();
  const time = String(timeHm || "").trim();

  const dt = DateTime.fromFormat(`${date} ${time}`, "yyyy-LL-dd HH:mm", {
    zone: BUSINESS_TIME_ZONE,
  });

  return dt.isValid ? dt.toMillis() : Number.NaN;
}
