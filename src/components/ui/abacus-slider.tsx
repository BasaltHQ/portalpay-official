"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

type AbacusSliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
  className?: string
}

const AbacusSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  AbacusSliderProps
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full select-none items-center py-3",
      className
    )}
    {...props}
  >
    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none">
      <div className="h-1.5 rounded-full bg-gradient-to-r from-orange-200/60 via-orange-100/40 to-orange-200/60 dark:from-orange-900/30 dark:via-orange-800/30 dark:to-orange-900/30 border border-orange-300/40 dark:border-orange-700/40 shadow-inner" />
    </div>
    <SliderPrimitive.Track className="relative h-6 w-full grow overflow-hidden rounded-full bg-transparent">
      <SliderPrimitive.Range className="absolute h-full bg-orange-300/60 dark:bg-orange-500/60" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-7 w-7 rounded-full border-2 border-orange-700 bg-orange-500 shadow-md ring-offset-background transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 dark:focus-visible:ring-orange-500 disabled:pointer-events-none disabled:opacity-50 hover:scale-105" />
  </SliderPrimitive.Root>
))
AbacusSlider.displayName = "AbacusSlider"

export { AbacusSlider }


