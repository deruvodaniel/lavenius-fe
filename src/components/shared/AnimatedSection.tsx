import React, { useEffect, useRef, useState } from 'react';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fade' | 'slide-up' | 'slide-left' | 'scale' | 'none';
  delay?: number;
  duration?: number;
}

export function AnimatedSection({ 
  children, 
  className = '',
  animation = 'fade',
  delay = 0,
  duration = 300
}: AnimatedSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setIsVisible(true);
            }, delay);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    const element = ref.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [delay]);

  const animationClasses = {
    fade: {
      initial: 'opacity-0',
      animate: 'opacity-100',
      transition: 'transition-opacity'
    },
    'slide-up': {
      initial: 'opacity-0 translate-y-8',
      animate: 'opacity-100 translate-y-0',
      transition: 'transition-all'
    },
    'slide-left': {
      initial: 'opacity-0 translate-x-8',
      animate: 'opacity-100 translate-x-0',
      transition: 'transition-all'
    },
    scale: {
      initial: 'opacity-0 scale-95',
      animate: 'opacity-100 scale-100',
      transition: 'transition-all'
    },
    none: {
      initial: '',
      animate: '',
      transition: ''
    }
  };

  const anim = animationClasses[animation];

  return (
    <div
      ref={ref}
      className={`${anim.transition} ${isVisible ? anim.animate : anim.initial} ${className}`}
      style={{
        transitionDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  );
}

// Componente para animar listas de items con delays escalonados
export function AnimatedList({ 
  children,
  className = '',
  animation = 'slide-up',
  stagger = 50
}: {
  children: React.ReactNode[];
  className?: string;
  animation?: 'fade' | 'slide-up' | 'slide-left' | 'scale';
  stagger?: number;
}) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <AnimatedSection 
          animation={animation} 
          delay={index * stagger}
          key={index}
        >
          {child}
        </AnimatedSection>
      ))}
    </div>
  );
}
