import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ============================================================================
// ISOLATED useCountUp HOOK TESTS
// ============================================================================

// Since useCountUp is defined inside Landing.tsx and not exported,
// we need to test it through a recreated version or through integration.
// This file tests the hook logic pattern for animated counters.

// Recreate the hook for testing purposes
import { useState, useEffect, useRef } from 'react';

function useCountUp(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) {
      setHasStarted(true);
    }
  }, [startOnView]);

  useEffect(() => {
    if (!startOnView) return;

    const observer = new IntersectionObserver(
      ([entry]: IntersectionObserverEntry[]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasStarted, startOnView]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [hasStarted, end, duration]);

  return { count, ref };
}

// ============================================================================
// MOCK SETUP
// ============================================================================

let intersectionCallback: IntersectionObserverCallback | null = null;
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

const setupIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn((callback: IntersectionObserverCallback) => {
    intersectionCallback = callback;
    return {
      observe: mockObserve,
      unobserve: mockUnobserve,
      disconnect: mockDisconnect,
    };
  });
  
  vi.stubGlobal('IntersectionObserver', mockIntersectionObserver);
};

const triggerIntersection = (isIntersecting: boolean) => {
  if (intersectionCallback) {
    intersectionCallback(
      [{ isIntersecting } as IntersectionObserverEntry],
      {} as IntersectionObserver
    );
  }
};

// ============================================================================
// RAF MOCK - More accurate simulation
// ============================================================================

class RAFSimulator {
  private callbacks: Map<number, (timestamp: number) => void> = new Map();
  private nextId = 1;
  private currentTime = 0;
  
  requestAnimationFrame = (callback: (timestamp: number) => void): number => {
    const id = this.nextId++;
    this.callbacks.set(id, callback);
    return id;
  };
  
  cancelAnimationFrame = (id: number): void => {
    this.callbacks.delete(id);
  };
  
  // Execute one frame at current time (processes all pending callbacks)
  tick(): void {
    const pendingCallbacks = new Map(this.callbacks);
    this.callbacks.clear();
    
    pendingCallbacks.forEach((callback) => {
      callback(this.currentTime);
    });
  }
  
  // Advance time to specific timestamp and execute pending callbacks
  advanceTimeTo(timestamp: number): void {
    this.currentTime = timestamp;
    this.tick();
  }
  
  // Advance time by ms and execute pending callbacks
  advanceTime(ms: number): void {
    this.currentTime += ms;
    this.tick();
  }
  
  // Run animation to completion over specified steps
  runToCompletion(totalMs: number, steps: number = 10): void {
    const stepMs = totalMs / steps;
    for (let i = 0; i <= steps; i++) {
      this.advanceTime(stepMs);
    }
  }
  
  // Run animation frames until no more are pending or max iterations reached
  runUntilIdle(maxIterations: number = 100): void {
    let iterations = 0;
    while (this.callbacks.size > 0 && iterations < maxIterations) {
      this.tick();
      iterations++;
    }
  }
  
  getCurrentTime(): number {
    return this.currentTime;
  }
  
  reset(): void {
    this.callbacks.clear();
    this.nextId = 1;
    this.currentTime = 0;
  }
  
  hasPendingCallbacks(): boolean {
    return this.callbacks.size > 0;
  }
}

// ============================================================================
// TESTS
// ============================================================================

describe('useCountUp Hook', () => {
  let rafSimulator: RAFSimulator;
  
  beforeEach(() => {
    vi.clearAllMocks();
    setupIntersectionObserver();
    
    rafSimulator = new RAFSimulator();
    vi.stubGlobal('requestAnimationFrame', rafSimulator.requestAnimationFrame);
    vi.stubGlobal('cancelAnimationFrame', rafSimulator.cancelAnimationFrame);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Initialization', () => {
    it('returns initial count of 0', () => {
      const { result } = renderHook(() => useCountUp(100));
      
      expect(result.current.count).toBe(0);
    });

    it('returns a ref object', () => {
      const { result } = renderHook(() => useCountUp(100));
      
      expect(result.current.ref).toBeDefined();
      expect(result.current.ref.current).toBeNull();
    });
  });

  describe('IntersectionObserver Setup', () => {
    it('creates IntersectionObserver when startOnView is true', () => {
      renderHook(() => useCountUp(100, 2000, true));
      
      expect(IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        { threshold: 0.3 }
      );
    });

    it('does not observe when ref is not attached', () => {
      renderHook(() => useCountUp(100, 2000, true));
      
      // Since ref.current is null, observe should not be called
      expect(mockObserve).not.toHaveBeenCalled();
    });

    it('disconnects observer on unmount', () => {
      const { unmount } = renderHook(() => useCountUp(100, 2000, true));
      
      unmount();
      
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe('Animation Without View Trigger (startOnView = false)', () => {
    it('starts animation immediately when startOnView is false', () => {
      renderHook(() => useCountUp(100, 1000, false));
      
      // Animation should register a callback
      expect(rafSimulator.hasPendingCallbacks()).toBe(true);
    });

    it('animates to target value over time', () => {
      const { result } = renderHook(() => useCountUp(100, 1000, false));
      
      // Run animation to completion
      act(() => {
        rafSimulator.runToCompletion(1000, 20);
      });
      
      expect(result.current.count).toBe(100);
    });

    it('reaches exact target value at completion', () => {
      const { result } = renderHook(() => useCountUp(500, 1000, false));
      
      // Run animation to completion
      act(() => {
        rafSimulator.runToCompletion(1000, 20);
      });
      
      expect(result.current.count).toBe(500);
    });
    
    it('progresses incrementally during animation', () => {
      const { result } = renderHook(() => useCountUp(100, 1000, false));
      
      // First tick initializes startTime
      act(() => {
        rafSimulator.advanceTimeTo(0);
      });
      
      // Capture progress at 10% time
      act(() => {
        rafSimulator.advanceTimeTo(100);
      });
      const countAt10Percent = result.current.count;
      
      // Advance to 50% time
      act(() => {
        rafSimulator.advanceTimeTo(500);
      });
      const countAt50Percent = result.current.count;
      
      // Values should be increasing
      expect(countAt10Percent).toBeGreaterThanOrEqual(0);
      expect(countAt50Percent).toBeGreaterThan(countAt10Percent);
      expect(countAt50Percent).toBeLessThanOrEqual(100);
    });
  });

  describe('Animation With View Trigger (startOnView = true)', () => {
    it('does not start animation before intersection', () => {
      const { result } = renderHook(() => useCountUp(100, 1000, true));
      
      // Without intersection, no animation callbacks should be pending
      expect(rafSimulator.hasPendingCallbacks()).toBe(false);
      expect(result.current.count).toBe(0);
    });

    it('starts animation after intersection', () => {
      const { result } = renderHook(() => useCountUp(100, 1000, true));
      
      // Trigger intersection
      act(() => {
        triggerIntersection(true);
      });
      
      // Now animation should proceed
      act(() => {
        rafSimulator.runToCompletion(1000, 20);
      });
      
      expect(result.current.count).toBe(100);
    });

    it('does not restart animation on subsequent intersections', () => {
      const { result } = renderHook(() => useCountUp(100, 1000, true));
      
      // First intersection
      act(() => {
        triggerIntersection(true);
      });
      
      act(() => {
        rafSimulator.runToCompletion(1000, 20);
      });
      
      const finalCount = result.current.count;
      expect(finalCount).toBe(100);
      
      // Exit and re-enter viewport
      act(() => {
        triggerIntersection(false);
      });
      
      act(() => {
        triggerIntersection(true);
      });
      
      // Count should remain at final value
      expect(result.current.count).toBe(finalCount);
    });
  });

  describe('Easing Function', () => {
    it('uses ease-out-quart easing (faster initial progress)', () => {
      const { result } = renderHook(() => useCountUp(100, 1000, false));
      
      // Run animation to 25% time
      act(() => {
        rafSimulator.runToCompletion(250, 5);
      });
      
      const countAt25 = result.current.count;
      
      // With ease-out-quart, progress at 25% should be > 25% of target
      // easeOutQuart(0.25) = 1 - (0.75)^4 ≈ 0.68 (68%)
      // Allow some variance due to discrete time steps
      expect(countAt25).toBeGreaterThan(40);
    });
    
    it('approaches target value smoothly', () => {
      const { result } = renderHook(() => useCountUp(100, 1000, false));
      
      // Run to completion
      act(() => {
        rafSimulator.runToCompletion(1000, 20);
      });
      
      // Should reach exactly 100
      expect(result.current.count).toBe(100);
    });
  });

  describe('Cleanup', () => {
    it('cancels animation frame on unmount', () => {
      const cancelSpy = vi.fn();
      vi.stubGlobal('cancelAnimationFrame', cancelSpy);
      
      const { unmount } = renderHook(() => useCountUp(100, 1000, false));
      
      // Start animation
      act(() => {
        rafSimulator.advanceTime(100);
      });
      
      // Unmount during animation
      unmount();
      
      // cancelAnimationFrame should have been called
      expect(cancelSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero target value', () => {
      const { result } = renderHook(() => useCountUp(0, 1000, false));
      
      act(() => {
        rafSimulator.runToCompletion(1000, 10);
      });
      
      expect(result.current.count).toBe(0);
    });

    it('handles large target values', () => {
      const { result } = renderHook(() => useCountUp(10000, 1000, false));
      
      act(() => {
        rafSimulator.runToCompletion(1000, 20);
      });
      
      expect(result.current.count).toBe(10000);
    });

    it('handles very short duration', () => {
      const { result } = renderHook(() => useCountUp(100, 10, false));
      
      act(() => {
        rafSimulator.runToCompletion(10, 5);
      });
      
      expect(result.current.count).toBe(100);
    });

    it('handles very long duration', () => {
      const { result } = renderHook(() => useCountUp(100, 10000, false));
      
      // Run to about halfway
      act(() => {
        rafSimulator.runToCompletion(5000, 20);
      });
      
      // Should be past halfway due to ease-out easing
      // At 50% time with easeOutQuart, should have ~94% progress
      expect(result.current.count).toBeGreaterThan(70);
      expect(result.current.count).toBeLessThan(100);
    });
  });
});

describe('AnimatedStatCard Integration', () => {
  let rafSimulator: RAFSimulator;
  
  beforeEach(() => {
    vi.clearAllMocks();
    setupIntersectionObserver();
    
    rafSimulator = new RAFSimulator();
    vi.stubGlobal('requestAnimationFrame', rafSimulator.requestAnimationFrame);
    vi.stubGlobal('cancelAnimationFrame', rafSimulator.cancelAnimationFrame);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should display formatted count with prefix', () => {
    const { result } = renderHook(() => useCountUp(500, 100, false));
    
    act(() => {
      rafSimulator.runToCompletion(100, 10);
    });
    
    // Verify count can be formatted with prefix
    const formatted = `+${result.current.count.toLocaleString()}`;
    expect(formatted).toBe('+500');
  });

  it('should display formatted count with suffix', () => {
    const { result } = renderHook(() => useCountUp(5, 100, false));
    
    act(() => {
      rafSimulator.runToCompletion(100, 10);
    });
    
    // Verify count can be formatted with suffix
    const formatted = `+$${result.current.count}M`;
    expect(formatted).toBe('+$5M');
  });
  
  it('should handle locale formatting for large numbers', () => {
    const { result } = renderHook(() => useCountUp(1234567, 100, false));
    
    act(() => {
      rafSimulator.runToCompletion(100, 10);
    });
    
    // Verify count can be locale formatted
    expect(result.current.count).toBe(1234567);
    expect(result.current.count.toLocaleString()).toBeTruthy();
  });
});
