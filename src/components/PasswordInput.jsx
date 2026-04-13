import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const PasswordInput = React.forwardRef(
  ({ label,
     placeholder = "Enter password", 
     disabled = false, 
     ...rest 
    }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    return (
      <div className="relative">
        {label && (
          <label className="block text-sm font-medium text-dark dark:text-dark mb-2">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <input
            ref={ref}
            type={showPassword ? "text" : "password"}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-4 py-2 pr-12 border border-secondary/30 rounded-lg bg-light text-dark placeholder-dark/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition disabled:bg-light/70 disabled:cursor-not-allowed dark:bg-light dark:text-dark dark:placeholder-dark/60"
            {...rest}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            disabled={disabled}
            className="absolute right-3 p-1 text-dark/50 hover:text-dark focus:outline-none focus:ring-2 focus:ring-primary rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";
export default PasswordInput;
