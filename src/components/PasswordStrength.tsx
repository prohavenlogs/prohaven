import { Check, X } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
}

const PasswordStrength = ({ password }: PasswordStrengthProps) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const strength = Object.values(checks).filter(Boolean).length;
  
  const getColor = () => {
    if (strength <= 2) return "bg-red-500";
    if (strength <= 3) return "bg-yellow-500";
    if (strength <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${
              i <= strength ? getColor() : "bg-muted"
            }`}
          />
        ))}
      </div>
      <div className="text-xs space-y-1">
        <div className={`flex items-center gap-1 ${checks.length ? "text-green-400" : "text-muted-foreground"}`}>
          {checks.length ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
          <span>At least 8 characters</span>
        </div>
        <div className={`flex items-center gap-1 ${checks.uppercase ? "text-green-400" : "text-muted-foreground"}`}>
          {checks.uppercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
          <span>One uppercase letter</span>
        </div>
        <div className={`flex items-center gap-1 ${checks.number ? "text-green-400" : "text-muted-foreground"}`}>
          {checks.number ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
          <span>One number</span>
        </div>
      </div>
    </div>
  );
};

export default PasswordStrength;
