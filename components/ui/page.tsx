import * as React from 'react'

import { cn } from '@/lib/utils'

export function Page({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-8', className)} {...props} />
}

export function PageHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
      {...props}
    />
  )
}

export function PageTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h1 className={cn('text-3xl font-bold text-white tracking-tight', className)} {...props} />
}

export function PageDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-gray-400', className)} {...props} />
}

export function PageActions({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-3', className)} {...props} />
}

export function PageSection({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn('space-y-4', className)} {...props} />
}
