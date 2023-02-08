import React from 'react'

export const BlueButton = React.forwardRef<
  HTMLButtonElement,
  {
    onClick?: () => void
    children?: any
    className?: React.ReactNode
    disabled?: boolean
  }
>(({ onClick, children, className, disabled, ...props }, ref) => {
  return (
    <button
      className={' bg-accent rounded px-2 py-2 w-48 text-white ' + className}
      onClick={onClick}
      disabled={disabled}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  )
})
