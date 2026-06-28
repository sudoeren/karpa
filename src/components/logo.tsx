"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  size?: number
  className?: string
}

export function Logo({ size = 32, className }: LogoProps) {
  return (
    <div 
      className={cn("relative shrink-0 overflow-hidden rounded-lg", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo.png"
        alt="Karpa Logo"
        fill
        className="object-contain"
        priority
      />
    </div>
  )
}
