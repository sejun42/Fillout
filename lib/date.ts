import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export interface CalendarDay {
  iso: string;
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function toIsoDate(value: Date) {
  return format(value, "yyyy-MM-dd");
}

export function fromIsoDate(value: string) {
  return parseISO(value);
}

export function formatMonthLabel(value: Date) {
  return format(value, "MMMM yyyy");
}

export function formatShortDate(value: string) {
  return format(fromIsoDate(value), "M.d (EEE)");
}

export function formatLongDate(value: string) {
  return format(fromIsoDate(value), "yyyy년 M월 d일 EEEE");
}

export function buildCalendarDays(monthDate: Date) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: CalendarDay[] = [];
  let current = calendarStart;

  while (current <= calendarEnd) {
    days.push({
      iso: toIsoDate(current),
      date: current,
      dayNumber: Number(format(current, "d")),
      isCurrentMonth: isSameMonth(current, monthStart),
      isToday: isToday(current),
    });

    current = addDays(current, 1);
  }

  return days;
}

export function addDaysIso(value: string, amount: number) {
  return toIsoDate(addDays(fromIsoDate(value), amount));
}
