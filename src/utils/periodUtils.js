export function getCurrentPeriod() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const totalMinutes = hour * 60 + minute;

    if (totalMinutes >= 9 * 60 && totalMinutes < 9 * 60 + 55) return 1;
    if (totalMinutes >= 9 * 60 + 55 && totalMinutes < 10 * 60 + 50) return 2;
    if (totalMinutes >= 11 * 60 + 5 && totalMinutes < 12 * 60) return 3;
    if (totalMinutes >= 12 * 60 && totalMinutes < 12 * 60 + 55) return 4;
    if (totalMinutes >= 13 * 60 + 40 && totalMinutes < 14 * 60 + 35) return 5;
    if (totalMinutes >= 14 * 60 + 35 && totalMinutes < 15 * 60 + 30) return 6;

    return null; // Break or lunch
}
