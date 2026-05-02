/**
 * Type definitions for UiButton.
 *
 * Kept in a separate `.ts` file because Vue's `<script setup>` does not
 * re-export named TypeScript types from `.vue` files reliably.
 */

export type UiButtonVariant =
  | 'primary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'delete'
  | 'outline'

export type UiButtonSize = 'sm' | 'md' | 'lg'
