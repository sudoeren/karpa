"use client"

import { cn } from "@/lib/utils"

interface LogoProps {
  size?: number
  className?: string
}

export function Logo({ size = 32, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
    >
      {/* Outer rounded square */}
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="8"
        className="fill-foreground"
      />
      
      {/* Inner design - stylized "L" with translation arrows */}
      <g className="fill-background">
        {/* Main L shape */}
        <path d="M9 8h4v12h6v4H9V8z" />
        
        {/* Translation arrow right */}
        <path d="M20 10l4 3-4 3v-2h-3v-2h3v-2z" />
        
        {/* Small dot accent */}
        <circle cx="23" cy="21" r="2" />
      </g>
    </svg>
  )
}
