'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useDebounce } from './useDebounce';

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  itemKey?: (item: T, index: number) => string | number;
  onScroll?: (scrollTop: number) => void;
}

/**
 * VirtualizedList component for efficiently rendering large lists
 * Only renders items that are visible in the viewport, plus some overscan
 */
function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 3,
  className = '',
  itemKey = (_, index) => index,
  onScroll
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  
  // Calculate total height of list
  const totalHeight = items.length * itemHeight;
  
  // Calculate which items to render based on scroll position
  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    // Calculate the visible range
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + height) / itemHeight) + overscan
    );
    
    // Create array of visible items with their offsets
    const visibleItemsArray = [];
    for (let i = start; i <= end; i++) {
      visibleItemsArray.push({
        item: items[i],
        index: i,
        offsetTop: i * itemHeight
      });
    }
    
    return { startIndex: start, endIndex: end, visibleItems: visibleItemsArray };
  }, [items, height, itemHeight, scrollTop, overscan]);
  
  // Handle scroll events
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  };
  
  return (
    <div 
      ref={containerRef}
      style={{ height, overflow: 'auto', position: 'relative' }} 
      className={className}
      onScroll={handleScroll}
    >
      {/* Spacer div to maintain scroll area */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Only render visible items */}
        {visibleItems.map(({ item, index, offsetTop }) => (
          <div 
            key={itemKey(item, index)} 
            style={{ 
              position: 'absolute',
              top: 0,
              transform: `translateY(${offsetTop}px)`,
              width: '100%',
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Hook for virtualizing a list with dynamic item heights
 * More complex but handles variable height items
 */
export function useVirtualizedList<T>(options: {
  items: T[];
  estimatedItemHeight: number;
  overscan?: number;
  getScrollElement?: () => HTMLElement | null;
}) {
  const { 
    items, 
    estimatedItemHeight, 
    overscan = 3,
    getScrollElement = () => null 
  } = options;
  
  // Refs for measurements
  const itemHeights = useRef<number[]>([]);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  
  // Measure container height on mount
  useEffect(() => {
    const scrollElement = getScrollElement();
    if (!scrollElement) return;
    
    setContainerHeight(scrollElement.clientHeight);
    
    const handleResize = () => {
      setContainerHeight(scrollElement.clientHeight);
    };
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getScrollElement]);
  
  // Update scroll position
  const handleScroll = () => {
    const scrollElement = getScrollElement();
    if (!scrollElement) return;
    
    setScrollTop(scrollElement.scrollTop);
  };
  
  // Debounce scroll handler for better performance
  const debouncedHandleScroll = useDebounce(handleScroll, 10);
  
  // Attach scroll listener
  useEffect(() => {
    const scrollElement = getScrollElement();
    if (!scrollElement) return;
    
    scrollElement.addEventListener('scroll', debouncedHandleScroll);
    return () => scrollElement.removeEventListener('scroll', debouncedHandleScroll);
  }, [getScrollElement, debouncedHandleScroll]);
  
  // Calculate visible range
  return useMemo(() => {
    // Fill in missing item heights with estimated height
    while (itemHeights.current.length < items.length) {
      itemHeights.current.push(estimatedItemHeight);
    }
    
    // Calculate cumulative heights for positioning
    let totalHeight = 0;
    const offsetMap = new Map<number, number>();
    
    for (let i = 0; i < items.length; i++) {
      offsetMap.set(i, totalHeight);
      totalHeight += itemHeights.current[i];
    }
    
    // Find visible range
    let startIndex = 0;
    let endIndex = items.length - 1;
    
    // Binary search for start index
    let low = 0;
    let high = items.length - 1;
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const offset = offsetMap.get(mid) || 0;
      
      if (offset < scrollTop - overscan * estimatedItemHeight) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    
    startIndex = Math.max(0, low - overscan);
    
    // Find end index
    const visibleBottom = scrollTop + containerHeight;
    let i = startIndex;
    
    while (i < items.length && (offsetMap.get(i) || 0) < visibleBottom + overscan * estimatedItemHeight) {
      i++;
    }
    
    endIndex = Math.min(items.length - 1, i);
    
    // Create array of visible items
    const visibleItems = [];
    for (let i = startIndex; i <= endIndex; i++) {
      visibleItems.push({
        item: items[i],
        index: i,
        offsetTop: offsetMap.get(i) || 0
      });
    }
    
    return {
      visibleItems,
      totalHeight,
      startIndex,
      endIndex,
      setItemHeight: (index: number, height: number) => {
        itemHeights.current[index] = height;
      }
    };
  }, [items, scrollTop, containerHeight, estimatedItemHeight, overscan]);
}

export default VirtualizedList;
