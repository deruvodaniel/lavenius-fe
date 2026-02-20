import { ReactNode, useEffect } from 'react';
import { X, LucideIcon } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';

// ============================================================================
// TYPES
// ============================================================================

export interface BaseDrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Callback when the drawer should close */
  onClose: () => void;
  /** Main content of the drawer */
  children: ReactNode;
  /** Title displayed in the header */
  title: string;
  /** Optional subtitle or description in the header */
  subtitle?: string;
  /** Optional icon to display in the header */
  icon?: LucideIcon;
  /** Maximum width class (default: 'md:max-w-lg') */
  maxWidth?: 'md:max-w-sm' | 'md:max-w-md' | 'md:max-w-lg' | 'md:max-w-xl' | 'md:max-w-2xl';
  /** Optional footer content (buttons, etc.) */
  footer?: ReactNode;
  /** Whether to show the default close button in header */
  showCloseButton?: boolean;
  /** Custom close button aria-label */
  closeLabel?: string;
  /** Whether closing is disabled (e.g., while saving) */
  disableClose?: boolean;
  /** Additional class names for the drawer container */
  className?: string;
  /** ARIA label for the drawer (for accessibility) */
  ariaLabel?: string;
  /** ID for the drawer title (for aria-labelledby) */
  titleId?: string;
  /** Custom header content (replaces default header) */
  customHeader?: ReactNode;
  /** Initial element to focus (CSS selector) */
  initialFocus?: string;
}

// ============================================================================
// DRAWER HEADER SUB-COMPONENT
// ============================================================================

interface DrawerHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  showCloseButton: boolean;
  closeLabel: string;
  onClose: () => void;
  disableClose: boolean;
  titleId: string;
}

function DrawerHeader({
  title,
  subtitle,
  icon: Icon,
  showCloseButton,
  closeLabel,
  onClose,
  disableClose,
  titleId,
}: DrawerHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>
            <h2 id={titleId} className="text-white text-xl">
              {title}
            </h2>
            {subtitle && (
              <p className="text-indigo-200 text-sm mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            disabled={disableClose}
            className={cn(
              'text-indigo-200 hover:text-white transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-700 rounded',
              disableClose && 'opacity-50 cursor-not-allowed'
            )}
            aria-label={closeLabel}
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// DRAWER FOOTER SUB-COMPONENT
// ============================================================================

interface DrawerFooterProps {
  children: ReactNode;
}

export function DrawerFooter({ children }: DrawerFooterProps) {
  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
      {children}
    </div>
  );
}

// ============================================================================
// DRAWER BODY SUB-COMPONENT
// ============================================================================

interface DrawerBodyProps {
  children: ReactNode;
  className?: string;
}

export function DrawerBody({ children, className }: DrawerBodyProps) {
  return (
    <div className={cn('p-4 md:p-6 space-y-4 md:space-y-6 flex-1 overflow-y-auto', className)}>
      {children}
    </div>
  );
}

// ============================================================================
// MAIN BASE DRAWER COMPONENT
// ============================================================================

/**
 * BaseDrawer - Reusable drawer component with built-in accessibility features
 * 
 * Features:
 * - Focus trap (Tab/Shift+Tab stays within drawer)
 * - ESC key to close
 * - Scroll lock on body when open
 * - ARIA attributes for screen readers
 * - Responsive design (full screen on mobile, side drawer on desktop)
 * - Consistent header styling with gradient
 * 
 * @example
 * ```tsx
 * <BaseDrawer
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Edit Patient"
 *   icon={UserIcon}
 * >
 *   <DrawerBody>
 *     <form>...</form>
 *   </DrawerBody>
 *   <DrawerFooter>
 *     <Button onClick={handleClose}>Cancel</Button>
 *     <Button onClick={handleSave}>Save</Button>
 *   </DrawerFooter>
 * </BaseDrawer>
 * ```
 */
export function BaseDrawer({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  icon,
  maxWidth = 'md:max-w-lg',
  footer,
  showCloseButton = true,
  closeLabel = 'Close drawer',
  disableClose = false,
  className,
  ariaLabel,
  titleId = 'drawer-title',
  customHeader,
  initialFocus,
}: BaseDrawerProps) {
  // Focus trap hook
  const containerRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onEscape: disableClose ? undefined : onClose,
    restoreFocus: true,
    initialFocus,
  });

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = () => {
    if (!disableClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex !top-0 !mt-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-label={ariaLabel}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        ref={containerRef}
        className={cn(
          'relative ml-auto h-full w-full bg-white shadow-2xl flex flex-col',
          // Animation classes
          'animate-in slide-in-from-right duration-300',
          maxWidth,
          className
        )}
      >
        {/* Header */}
        {customHeader || (
          <DrawerHeader
            title={title}
            subtitle={subtitle}
            icon={icon}
            showCloseButton={showCloseButton}
            closeLabel={closeLabel}
            onClose={onClose}
            disableClose={disableClose}
            titleId={titleId}
          />
        )}

        {/* Content */}
        {children}

        {/* Footer (if provided as prop) */}
        {footer && <DrawerFooter>{footer}</DrawerFooter>}
      </div>
    </div>
  );
}

// Export sub-components for composition
export { DrawerHeader };
