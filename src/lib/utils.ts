
export interface TextLinkButton {
    title: string;
    href: string;
};

export interface SubtitleSizedEntry {
    entry: string;
    size: number;
    href: string;
};

export interface Pages {
    pageString: string;
    href: string;
}

// HH:MM:SS Mon DD YYYY
export function toReadableFullDateString(millis: number, timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone): string {
    if (!millis) {
        millis = 0;
    }
    if (typeof Temporal !== "undefined") { // Still pending availability in Safari (6/26)
        let date = Temporal.Instant.fromEpochMilliseconds(millis).toZonedDateTimeISO(timeZone).toPlainDateTime();
        return `${date.hour.toString().padStart(2, "0")}:${date.minute.toString().padStart(2, "0")}:${date.second.toString().padStart(2, "0")} ${date.toLocaleString("en-US", { month: "short" })} ${date.day} ${date.year}`;
    }else { // Fallback to old Date API
        return new Intl.DateTimeFormat("en-US", {
            timeZone,
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            month: "short",
            day: "numeric",
            year: "numeric"
        }).format(new Date(millis)).replaceAll(",", "");
    }
};
