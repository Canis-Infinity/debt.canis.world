"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { zhTW } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DatePicker({
  id,
  name,
  defaultValue,
  disabled,
  invalid,
  describedBy,
}: {
  id: string
  name: string
  defaultValue: string
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
}) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(() =>
    defaultValue ? parseISO(defaultValue) : undefined
  )
  return (
    <>
      <input
        type="hidden"
        name={name}
        value={date ? format(date, "yyyy-MM-dd") : ""}
        required
        disabled={disabled}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              data-empty={!date}
              className="w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
            />
          }
        >
          <CalendarIcon aria-hidden="true" />
          {date ? format(date, "yyyy/MM/dd") : "選擇日期"}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date}
            locale={zhTW}
            startMonth={new Date(1900, 0)}
            disabled={{ before: new Date(1900, 0, 1) }}
            onSelect={(value) => {
              setDate(value)
              if (value) setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </>
  )
}
