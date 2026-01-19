import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Container com Design System
 *
 * Substitui as ~173 ocorrencias de:
 * - rounded-2xl border border-white/10 bg-zinc-900/60
 * - bg-zinc-950/40 border border-white/5
 *
 * Variantes:
 * - default: fundo elevado com borda sutil
 * - elevated: fundo mais claro com sombra maior
 * - glass: efeito glassmorphism com backdrop-blur
 * - surface: fundo sólido sem transparência
 */
const containerVariants = cva(
  [
    "rounded-2xl",
    "transition-all duration-200",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-zinc-900/60",
          "border border-white/10",
        ].join(" "),
        elevated: [
          "bg-zinc-800",
          "border border-white/10",
          "shadow-md",
        ].join(" "),
        glass: [
          "glass-panel",
        ].join(" "),
        surface: [
          "bg-zinc-900",
          "border border-white/10",
        ].join(" "),
        subtle: [
          "bg-zinc-950/40",
          "border border-white/5",
        ].join(" "),
      },
      padding: {
        none: "",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
        xl: "p-8",
      },
      hover: {
        true: [
          "hover:shadow-md",
          "hover:border-white/15",
        ].join(" "),
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      hover: false,
    },
  }
)

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

/**
 * Container genérico com estilos do Design System
 *
 * @example
 * ```tsx
 * // Container padrão
 * <Container>Conteúdo aqui</Container>
 *
 * // Container com hover
 * <Container hover>Card clicável</Container>
 *
 * // Container glass
 * <Container variant="glass" padding="lg">Modal content</Container>
 * ```
 */
function Container({
  className,
  variant,
  padding,
  hover,
  ...props
}: ContainerProps) {
  return (
    <div
      data-slot="container"
      className={cn(containerVariants({ variant, padding, hover }), className)}
      {...props}
    />
  )
}

export { Container, containerVariants }
