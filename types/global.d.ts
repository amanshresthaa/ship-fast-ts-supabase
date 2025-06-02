// Global type definitions for Node.js timers and other browser APIs

declare namespace NodeJS {
  interface Timeout {
    [Symbol.toPrimitive](): number;
  }
}

declare var IntersectionObserver: {
  prototype: IntersectionObserver;
  new(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ): IntersectionObserver;
};

interface IntersectionObserverInit {
  root?: Element | Document | null;
  rootMargin?: string;
  threshold?: number | number[];
}

interface IntersectionObserverEntry {
  readonly boundingClientRect: DOMRectReadOnly;
  readonly intersectionRatio: number;
  readonly intersectionRect: DOMRectReadOnly;
  readonly isIntersecting: boolean;
  readonly rootBounds: DOMRectReadOnly | null;
  readonly target: Element;
  readonly time: DOMHighResTimeStamp;
}

interface IntersectionObserver {
  readonly root: Element | Document | null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;
  disconnect(): void;
  observe(target: Element): void;
  takeRecords(): IntersectionObserverEntry[];
  unobserve(target: Element): void;
}

interface IntersectionObserverCallback {
  (entries: IntersectionObserverEntry[], observer: IntersectionObserver): void;
}

// Network Information API types
interface NetworkInformation extends EventTarget {
  readonly connection?: any;
  readonly downlink?: number;
  readonly downlinkMax?: number;
  readonly effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
  readonly rtt?: number;
  readonly saveData?: boolean;
  readonly type?: 'bluetooth' | 'cellular' | 'ethernet' | 'mixed' | 'none' | 'other' | 'unknown' | 'wifi' | 'wimax';
  onchange?: EventListener;
}

interface Navigator {
  readonly connection?: NetworkInformation;
}

// Performance API enhancements
interface Performance {
  memory?: {
    readonly jsHeapSizeLimit: number;
    readonly totalJSHeapSize: number;
    readonly usedJSHeapSize: number;
  };
}

// Idle callback API
interface IdleDeadline {
  didTimeout: boolean;
  timeRemaining(): number;
}

interface Window {
  requestIdleCallback?(
    callback: (deadline: IdleDeadline) => void,
    options?: { timeout: number }
  ): number;
  cancelIdleCallback?(handle: number): void;
}
