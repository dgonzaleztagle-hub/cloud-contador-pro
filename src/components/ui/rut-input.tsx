import * as React from "react"
import { Input } from "@/components/ui/input"
import { validateRut, formatRut, cleanRut } from "@/lib/rutValidator"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle } from "lucide-react"

export interface RutInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  onValidationChange?: (isValid: boolean) => void
  showValidation?: boolean
}

const RutInput = React.forwardRef<HTMLInputElement, RutInputProps>(
  ({ className, value, onChange, onValidationChange, showValidation = true, ...props }, ref) => {
    const [isValid, setIsValid] = React.useState<boolean | null>(null)
    const [isTouched, setIsTouched] = React.useState(false)

    React.useEffect(() => {
      if (value && isTouched) {
        const valid = validateRut(value)
        setIsValid(valid)
        onValidationChange?.(valid)
      } else {
        setIsValid(null)
      }
    }, [value, isTouched, onValidationChange])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      // Limpiar y formatear
      const cleaned = cleanRut(inputValue)
      
      // Permitir solo números, K y guión
      if (cleaned.length > 0 && !/^[\dK]+$/.test(cleaned)) {
        return
      }
      
      // Limitar longitud (máximo 9 caracteres sin formato: 12345678K)
      if (cleaned.length > 9) {
        return
      }
      
      onChange(inputValue)
    }

    const handleBlur = () => {
      setIsTouched(true)
      // Formatear al perder el foco
      if (value && value.length >= 2) {
        const formatted = formatRut(value)
        onChange(formatted)
      }
    }

    return (
      <div className="relative">
        <Input
          ref={ref}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            className,
            isValid === false && isTouched && "border-destructive pr-10",
            isValid === true && isTouched && "border-green-500 pr-10"
          )}
          placeholder="12.345.678-9"
          {...props}
        />
        {showValidation && isTouched && isValid !== null && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
          </div>
        )}
      </div>
    )
  }
)

RutInput.displayName = "RutInput"

export { RutInput }
