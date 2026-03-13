import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface BaseFieldProps {
  label: string;
  error?: string;
  disabled?: boolean;
}

interface TextFieldProps extends BaseFieldProps {
  value: string;
  placeholder?: string;
  type?: string;
  onChange: (value: string) => void;
}

export function FormTextField({ label, error, disabled, value, placeholder, type = "text", onChange }: TextFieldProps) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input type={type} value={value} placeholder={placeholder} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

interface SelectFieldProps extends BaseFieldProps {
  value: string;
  placeholder?: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}

export function FormSelectField({ label, error, disabled, value, options, placeholder, onChange }: SelectFieldProps) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

interface TextareaFieldProps extends BaseFieldProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

export function FormTextareaField({ label, error, disabled, value, placeholder, onChange }: TextareaFieldProps) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Textarea value={value} placeholder={placeholder} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
