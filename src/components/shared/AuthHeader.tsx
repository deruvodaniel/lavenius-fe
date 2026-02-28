import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './LanguageSwitcher';
import { cn } from '@/components/ui/utils';

interface AuthHeaderProps {
  /** Whether header has transparent/glass background (for landing page) */
  variant?: 'default' | 'glass';
  /** Whether to show navigation links */
  showNavLinks?: boolean;
  /** Custom className for the header */
  className?: string;
}

/**
 * Shared header component with Clerk authentication integration.
 * 
 * Features:
 * - Logo/brand on left
 * - Optional navigation links
 * - Auth section on right: SignIn + SignUp when signed out, UserButton when signed in
 * - Language switcher
 * - Responsive design
 * - Dark mode compatible
 */
export function AuthHeader({ 
  variant = 'default', 
  showNavLinks = false,
  className 
}: AuthHeaderProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const headerClasses = cn(
    'fixed top-0 left-0 right-0 z-50 border-b',
    variant === 'glass'
      ? 'bg-background/80 backdrop-blur-md border-border'
      : 'bg-background border-border',
    className
  );

  return (
    <header className={headerClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link 
            to="/" 
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {t('landing.brand')}
            </span>
          </Link>

          {/* Navigation Links (optional) */}
          {showNavLinks && (
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="#features"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('landing.nav.features', 'Features')}
              </Link>
              <Link
                to="#pricing"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('landing.nav.pricing', 'Pricing')}
              </Link>
            </nav>
          )}

          {/* Right Section: Language + Auth */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="buttons" />
            
            {/* Signed Out: Show Sign In + Sign Up buttons */}
            <SignedOut>
              <SignInButton mode="modal">
                <Button 
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  {t('landing.cta.login')}
                </Button>
              </SignInButton>
              
              <SignUpButton mode="modal">
                <Button 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-sm hover:shadow-md transition-all"
                >
                  {t('landing.hero.cta')}
                </Button>
              </SignUpButton>
            </SignedOut>
            
            {/* Signed In: Show User Button with dropdown */}
            <SignedIn>
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                {t('landing.nav.dashboard', 'Dashboard')}
              </Button>
              
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    // Use CSS classes for consistent theming
                    avatarBox: 'w-9 h-9 ring-2 ring-transparent hover:ring-indigo-500/50 transition-all',
                    userButtonTrigger: 'focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none rounded-full',
                  }
                }}
              />
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Minimal auth buttons component for use in other headers/navbars.
 * Provides just the Clerk buttons without the full header structure.
 */
export function AuthButtons({ className }: { className?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <SignedOut>
        <SignInButton mode="modal">
          <Button 
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          >
            {t('landing.cta.login')}
          </Button>
        </SignInButton>
        
        <SignUpButton mode="modal">
          <Button 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
          >
            {t('landing.hero.cta')}
          </Button>
        </SignUpButton>
      </SignedOut>
      
      <SignedIn>
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="text-muted-foreground hover:text-foreground"
        >
          {t('landing.nav.dashboard', 'Dashboard')}
        </Button>
        
        <UserButton 
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: 'w-9 h-9',
            }
          }}
        />
      </SignedIn>
    </div>
  );
}
