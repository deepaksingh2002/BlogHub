import React, { useId, forwardRef } from "react";

const Select = (
  {
    options = [],
    label,
    className = "",
    ...props
  },
  ref
) => {
  const id = useId();

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block mb-1 text-sm font-medium text-dark dark:text-dark"
        >
          {label}
        </label>
      )}

      <select
        id={id}
        ref={ref}
        {...props}
        className={`px-3 py-2 rounded-lg bg-light text-dark outline-none focus:bg-light/80 duration-200 border border-secondary/30 w-full ${className}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default forwardRef(Select);
