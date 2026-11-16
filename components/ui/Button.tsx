"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { MagneticElement } from "@/components/motion/MagneticElement";
import { audioManager } from "@/lib/audio";

type ButtonVariant = "primary" | "ghost" | "link";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}

type ButtonAsButton = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
    href?: undefined;
  };

type ButtonAsLink = ButtonBaseProps &
  Omit<React.ComponentPropsWithoutRef<typeof Link>, keyof ButtonBaseProps> & {
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-blush-600 text-white rounded-md hover:bg-blush-700 transition-colors shadow-sm",
  ghost:
    "bg-transparent text-ink hover:bg-blush-50 rounded-md border border-blush-200 transition-colors",
  link: "bg-transparent text-blush-700 hover:text-blush-600 underline-offset-4 hover:underline transition-colors",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-7 py-3 text-lg",
};

export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(function Button(props, ref) {
  const { variant = "primary", size = "md", className, children, ...rest } = props;

  const classes = cn(
    "inline-flex items-center justify-center font-medium",
    variantStyles[variant],
    sizeStyles[size],
    className
  );

  const content =
    variant === "primary" ? (
      <>
        {children}
        <span className="ms-1">&raquo;</span>
      </>
    ) : (
      children
    );

  if ("href" in rest && rest.href !== undefined) {
    const { href, ...linkRest } = rest as ButtonAsLink;
    return (
      <MagneticElement strength={0.25}>
        <motion.div
          className="inline-block"
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
        >
          <Link
            href={href}
            className={classes}
            ref={ref as React.Ref<HTMLAnchorElement>}
            {...linkRest}
          >
            {content}
          </Link>
        </motion.div>
      </MagneticElement>
    );
  }

  // Wrap button in motion.div to avoid prop conflict between HTML onDrag and Framer's onDrag
  const { onClick, ...buttonRest } = rest as ButtonAsButton;
  return (
    <MagneticElement strength={0.25}>
      <motion.div
        className="inline-block"
        whileHover={{ scale: 1.03, y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        <button
          className={classes}
          ref={ref as React.Ref<HTMLButtonElement>}
          onClick={(e) => {
            audioManager.play("soft-click");
            onClick?.(e);
          }}
          {...buttonRest}
        >
          {content}
        </button>
      </motion.div>
    </MagneticElement>
  );
});
