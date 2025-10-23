"use client";

import { useState } from "react";

interface ClientDateProps {
  date: Date | string;
  format?: "date" | "datetime" | "time";
  locale?: string;
}

export function ClientDate({
  date,
  format = "date",
  locale = "en-IN",
}: ClientDateProps) {
  const [mounted] = useState(() => typeof window !== "undefined");

  if (!mounted) {
    return <span>—</span>;
  }

  const dateObj = new Date(date);

  if (format === "date") {
    return (
      <span>
        {dateObj.toLocaleDateString(locale, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </span>
    );
  }

  if (format === "datetime") {
    return (
      <span>
        {dateObj.toLocaleString(locale, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    );
  }

  if (format === "time") {
    return (
      <span>
        {dateObj.toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    );
  }

  return <span>{dateObj.toLocaleDateString(locale)}</span>;
}
