import React, { useId } from 'react'

const Input = React.forwardRef(function Input({
    lable,
    label,
    type="text",
    className="",
    ...props
}, ref){
    const id = useId()
    const resolvedLabel = label ?? lable;
    return (
        <div className='w-full'>
            {resolvedLabel && <label
             className='inline-block mb-1 pl-1 text-dark dark:text-dark' 
            htmlFor={id}>
                        {resolvedLabel}
                    </label>}
                    <input type={type} 
                    className={`px-3 py-2 rounded-lg bg-light text-dark outline-none focus:bg-light/80 duration-200 border border-secondary/30 w-full dark:bg-light dark:text-dark dark:border-secondary/40 dark:focus:bg-light/90 ${className}`}
                     ref={ref}
                     {...props}
                     id={id}
                     />
        </div>
    )
}
)

export default Input

