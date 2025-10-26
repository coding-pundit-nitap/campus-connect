"use client";

import { ChevronDownIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DateTimePicker({
  handleOnDateChange,
}: {
  handleOnDateChange?: (date: Date) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [time, setTime] = React.useState<string>("10:30:00");

  const combineDateTime = (
    selectedDate: Date | undefined,
    selectedTime: string
  ) => {
    if (!selectedDate) {
      return undefined;
    }

    const [hours, minutes, seconds] = selectedTime.split(":").map(Number);
    const combinedDate = new Date(selectedDate);
    combinedDate.setHours(hours, minutes, seconds || 0, 0);
    return combinedDate;
  };

  const onDateChange = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    const combinedDateTime = combineDateTime(selectedDate, time);
    if (handleOnDateChange && combinedDateTime) {
      handleOnDateChange(combinedDateTime);
    }
    setOpen(false);
  };

  const onTimeChange = (selectedTime: string) => {
    setTime(selectedTime);
    const combinedDateTime = combineDateTime(date, selectedTime);
    if (handleOnDateChange && combinedDateTime) {
      handleOnDateChange(combinedDateTime);
    }
  };

  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-3">
        <Label htmlFor="date-picker" className="px-1">
          Date
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker"
              className="w-32 justify-between font-normal"
            >
              {date ? new Date(date).toLocaleDateString() : "Select date"}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              onSelect={(date) => onDateChange(date)}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-3">
        <Label htmlFor="time-picker" className="px-1">
          Time
        </Label>
        <Input
          type="time"
          id="time-picker"
          step="1"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  );
}
