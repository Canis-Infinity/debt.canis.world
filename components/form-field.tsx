import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field"
export function FormField({
  id,
  label,
  error,
  hint,
  children,
  required = false,
}: {
  id: string
  label: string
  error?: string[]
  hint?: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <Field data-invalid={!!error?.length}>
      <FieldLabel htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        )}
      </FieldLabel>
      {children}
      {hint && <FieldDescription>{hint}</FieldDescription>}
      <FieldError
        id={`${id}-error`}
        errors={error?.map((message) => ({ message }))}
      />
    </Field>
  )
}
