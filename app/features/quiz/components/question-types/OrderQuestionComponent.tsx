'use client';

import React, { useState, useEffect, memo, useMemo } from 'react'; // Added useMemo
import { motion } from 'framer-motion';
import { OrderQuestion, OrderItem, OrderQuestionAnswer } from '@/app/types/quiz';
import { OrderController } from '../../controllers/OrderController';
import { useAutoValidation } from '../../hooks/useAutoValidation';

interface OrderQuestionComponentProps {
  question: OrderQuestion;
  onAnswerSelect: (answer: OrderQuestionAnswer) => void; // Corrected definition
  userAnswer?: OrderQuestionAnswer;
  isSubmitted?: boolean;
  showCorrectAnswer?: boolean;
  isQuizReviewMode?: boolean;
  validateOnComplete?: boolean;
}

/**
 * OrderQuestionComponent handles drag and drop interactions for ordering questions
 * Uses the OrderController for business logic and validation
 * 
 * This component implements a slot-based ordering approach:
 * - Available items can be dragged to ordered slots
 * - Items in slots can be dragged back to available items
 * - Items can be dragged between slots to reorder
 */
const OrderQuestionComponent: React.FC<OrderQuestionComponentProps> = ({ 
  question, 
  onAnswerSelect, 
  userAnswer, // Changed from initialAnswer to userAnswer to match props definition
  isSubmitted = false,
  showCorrectAnswer = false,
  isQuizReviewMode = false,
  validateOnComplete = true
}) => {
  // Create controller instance, memoized to prevent re-creation on every render
  const controller = useMemo(() => new OrderController(question), [question]);
  
  // Track the current dragged item ID for browsers that don't support dataTransfer properly
  const [currentDraggedItemId, setCurrentDraggedItemId] = useState<string | null>(null);
  
  // Track available items (not yet placed in slots)
  const [availableItems, setAvailableItems] = useState<OrderItem[]>([]);

  // Initialize with controller's initial answer or user's previous answer
  // This is memoized and passed to useAutoValidation
  const initialAnswerForHook = useMemo(() => {
    return userAnswer || controller.createInitialAnswer();
  }, [userAnswer, controller]);
  
  // Use auto-validation hook with direct dependencies to ensure consistent state
  const [placedAnswers, setPlacedAnswers, autoValidating, allItemsOrdered] = useAutoValidation<
    OrderQuestion,
    OrderQuestionAnswer
  >(
    controller,
    initialAnswerForHook, // Use memoized initialAnswerForHook
    onAnswerSelect,
    validateOnComplete
  );

  // Initialize or update availableItems & placedAnswers when question or mode/userAnswer change
  useEffect(() => {
    if (isQuizReviewMode) {
      // In review mode, show the correct placement
      const correctAnswer: OrderQuestionAnswer = {};
      controller.getCorrectOrder().forEach((itemId, index) => {
        correctAnswer[`slot_${index}`] = itemId;
      });
      // Update only if different
      if (JSON.stringify(placedAnswers) !== JSON.stringify(correctAnswer)) {
        setPlacedAnswers(correctAnswer);
      }
      setAvailableItems([]);
    } else {
      const answer = userAnswer || controller.createInitialAnswer();
      // Determine available items
      const placedItemIds = Object.values(answer).filter(id => id !== null) as string[];
      const availableItemsList = question.items.filter(
        item => !placedItemIds.includes(item.item_id)
      );
      setAvailableItems(availableItemsList);
      // Update only if different
      if (JSON.stringify(placedAnswers) !== JSON.stringify(answer)) {
        setPlacedAnswers(answer);
      }
    }
  // Note: intentionally not including setPlacedAnswers in deps to prevent effect loop
  }, [isQuizReviewMode, userAnswer, question.items, controller]);

  /**
   * Simplified drag start event handler (similar to DragAndDropQuestionComponent)
   */
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, itemId: string) => {
    if (isSubmitted || isQuizReviewMode) return;
    
    // Store the current dragged item info in state (fallback for browsers with dataTransfer issues)
    setCurrentDraggedItemId(itemId);
    
    try {
      // Set data in dataTransfer object - simple approach
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', itemId);
      console.log('Drag start:', itemId);
    } catch (err) {
      console.warn('Could not set dataTransfer data:', err);
      // We'll rely on the state variable in this case
    }
  };

  /**
   * Simplified drag event handlers (similar to DragAndDropQuestionComponent)
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  /**
   * Updates placement of an item in a specific slot
   * Similar to updatePlacement in DragAndDropQuestionComponent but with different logic for OrderQuestionComponent
   */
  const updatePlacement = (itemId: string, targetSlotKey: string) => {
    if (isSubmitted || isQuizReviewMode) return;
    
    console.log('Updating placement:', { itemId, targetSlotKey });
    
    // Create new copy of placed answers
    const newAnswers: OrderQuestionAnswer = { ...placedAnswers };
    
    // Find if the item is already in another slot
    let sourceSlotKey: string | undefined;
    Object.entries(newAnswers).forEach(([key, value]) => {
      if (value === itemId) {
        sourceSlotKey = key;
      }
    });
    
    // Get current item in target slot (might be null)
    const itemInTargetSlot = newAnswers[targetSlotKey];
    
    if (sourceSlotKey) {
      // Item is being moved from one slot to another
      if (itemInTargetSlot) {
        // Swap the items
        newAnswers[sourceSlotKey] = itemInTargetSlot;
      } else {
        // Clear the source slot since target is empty
        newAnswers[sourceSlotKey] = null;
      }
    } else {
      // Item is coming from available items
      if (itemInTargetSlot) {
        // Put the displaced item back in available items
        const displacedItem = question.items.find(item => item.item_id === itemInTargetSlot);
        if (displacedItem) {
          setAvailableItems(prev => {
            if (!prev.find(i => i.item_id === displacedItem.item_id)) {
              return [...prev, displacedItem];
            }
            return prev;
          });
        }
      }
      
      // Remove the item being placed from available items
      setAvailableItems(prev => prev.filter(item => item.item_id !== itemId));
    }
    
    // Place the item in the target slot
    newAnswers[targetSlotKey] = itemId;
    
    // Update state
    setPlacedAnswers(newAnswers);
    setCurrentDraggedItemId(null); // Clear dragged item state
  };

  /**
   * Simplified drop handler for slots (similar to handleDrop in DragAndDropQuestionComponent)
   */
  const handleDropOnSlot = (e: React.DragEvent<HTMLDivElement>, targetSlotKey: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    console.log('Drop on slot:', targetSlotKey);
    
    if (isSubmitted || isQuizReviewMode) return;

    // Get the item ID from dataTransfer or state
    let itemId = e.dataTransfer.getData('text/plain');
    if (!itemId && currentDraggedItemId) {
      itemId = currentDraggedItemId;
      console.log('Using fallback itemId from state:', itemId);
    }

    if (!itemId) {
      console.error('No item ID found in drop data');
      return;
    }

    // Validate item exists
    const droppedItem = question.items.find(item => item.item_id === itemId);
    if (!droppedItem) {
      console.error('Item not found:', itemId);
      return;
    }
    
    // Update the placement
    updatePlacement(itemId, targetSlotKey);
  };

  /**
   * Handles drop event back to available items
   */
  const handleDropOnAvailable = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    console.log('Drop on available items area');
    
    if (isSubmitted || isQuizReviewMode) return;

    // Get the item ID from dataTransfer or state
    let itemId = e.dataTransfer.getData('text/plain');
    if (!itemId && currentDraggedItemId) {
      itemId = currentDraggedItemId;
      console.log('Using fallback itemId from state for available drop:', itemId);
    }

    if (!itemId) {
      console.error('No item ID found in drop data');
      return;
    }

    // Find which slot this item is in (if any)
    let sourceSlotKey: string | null = null;
    Object.entries(placedAnswers).forEach(([key, value]) => {
      if (value === itemId) {
        sourceSlotKey = key;
      }
    });
    
    if (!sourceSlotKey) {
      console.log('Item not found in any slot, possibly already in available area');
      return;
    }
    
    // Create a copy of current answers
    const newAnswers = { ...placedAnswers };
    
    // Remove the item from its slot
    newAnswers[sourceSlotKey] = null;
    
    // Move the item back to available items
    const item = question.items.find(i => i.item_id === itemId);
    if (item) {
      setAvailableItems(prev => {
        if (!prev.find(i => i.item_id === item.item_id)) { // Avoid duplicates
          return [...prev, item];
        }
        return prev;
      });
    }
    
    // Update state
    setPlacedAnswers(newAnswers);
    setCurrentDraggedItemId(null); // Clear dragged item state
  };

  /**
   * Find the text for an item by its ID
   */
  const getItemTextById = (itemId: string): string => {
    const item = question.items.find(item => item.item_id === itemId);
    return item ? item.text : 'Unknown item';
  };

  /**
   * Determines if we should show feedback for answers
   */
  const shouldShowFeedback = (): boolean => {
    return (isSubmitted && showCorrectAnswer) || isQuizReviewMode;
  };

  /**
   * Gets styles for an available item
   */
  const getAvailableItemStyles = (itemId: string): string => {
    const baseStyle = "p-4 border-2 rounded mb-2 bg-white transition-all duration-200";
    
    // If showing feedback and the item should be part of the correct order
    if (shouldShowFeedback() && controller.getCorrectOrder().includes(itemId)) {
      // This is a distractor that should have been used
      return `${baseStyle} border-blue-500 bg-blue-50`;
    }
    
    // Default style or when being dragged
    return `${baseStyle} ${
      itemId === currentDraggedItemId ? 'border-blue-500 shadow-md opacity-50' : 'border-gray-300'
    }`;
  };

  /**
   * Gets styles for a slot item based on its correctness
   */
  const getSlotItemStyles = (slotIndex: number, itemId: string | null): string => {
    const baseStyle = "p-4 border-2 rounded mb-2 transition-all duration-200 relative pl-10 min-h-[60px] flex items-center"; // Base styles
    
    // When no item is placed in this slot
    if (itemId === null) {
      // If showing feedback, keep it neutral unless we want to show "empty but should be X"
      if (shouldShowFeedback()) {
         return `${baseStyle} border-gray-300 bg-gray-50`; // Or specific style for empty during review
      }
      // Make empty slots more obviously droppable with dashed border and distinct background
      return `${baseStyle} border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-100/50 hover:border-blue-400 justify-center`; // Center placeholder text
    }
    
    // If not showing feedback, just show normal style or highlight if dragged
    if (!shouldShowFeedback()) {
      return `${baseStyle} bg-white ${
        itemId === currentDraggedItemId 
          ? 'border-blue-500 shadow-md opacity-50' 
          : 'border-gray-300 hover:border-blue-300 hover:shadow-md'
      }`;
    }
    
    // Check if the item is in the correct position
    const isCorrect = controller.isItemCorrectlyPlacedInSlot(slotIndex, itemId);
    
    return `${baseStyle} ${
      isCorrect 
        ? 'border-green-500 bg-green-50 shadow-md' 
        : 'border-red-500 bg-red-50 shadow-sm'
    }`;
  };

  // Auto-validating feedback banner
  const AutoValidatingBanner = memo(() => (
    <div className="mt-4 p-2 border rounded bg-blue-50 text-blue-700">
      Auto-validating your answer... All slots filled.
    </div>
  ));

  // Ready to submit banner
  const ReadyBanner = memo(() => (
    <div className="mt-4 p-2 border rounded bg-green-50 text-green-700">
      All slots filled. Ready to submit!
    </div>
  ));

  /**
   * Determines which feedback banner to show
   */
  const getFeedbackBanner = () => {
    if (autoValidating && allItemsOrdered) {
      return <AutoValidatingBanner />;
    }
    
    if (allItemsOrdered && !autoValidating) {
      return <ReadyBanner />;
    }
    
    return null;
  };

  // Position indicator component
  const PositionIndicator = memo(({ position }: { position: number }) => (
    <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center bg-gray-100 border-r border-gray-300 text-gray-700 font-bold">
      {position + 1}
    </div>
  ));

  // Feedback icon component
  const FeedbackIcon = memo(({ isCorrect }: { isCorrect: boolean }) => (
    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
      {isCorrect ? (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-sm bg-green-500 shadow-md">
          ✓
        </span>
      ) : (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-sm bg-red-500 shadow-md">
          ✗
        </span>
      )}
    </div>
  ));

  // Show the correct order if needed
  const CorrectOrderDisplay = memo(() => (
    <div className="mt-6 p-4 border rounded bg-blue-50">
      <h3 className="font-semibold text-blue-800 mb-2">Correct Order:</h3>
      <ol className="list-decimal list-inside">
        {controller.getCorrectOrder().map((itemId, index) => (
          <li key={`correct-${itemId}`} className="py-1 text-gray-800">
            {getItemTextById(itemId)}
          </li>
        ))}
      </ol>
    </div>
  ));

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left side: Available Items */}
        <div className="flex-1">
          <h3 className="font-medium mb-4">Available Items:</h3>
          <div 
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 min-h-[200px] transition-colors duration-200 hover:border-blue-300"
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDropOnAvailable}
          >
            {availableItems.length > 0 ? (
              <div className="space-y-2">
                {availableItems.map((item) => (
                  <motion.div
                    key={`available-${item.item_id}`}
                    layout
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <div
                      draggable={!isSubmitted && !isQuizReviewMode}
                      onDragStart={(e) => handleDragStart(e, item.item_id)}
                      className={`${getAvailableItemStyles(item.item_id)} cursor-grab active:cursor-grabbing select-none`}
                    >
                      {item.text}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                {isSubmitted || isQuizReviewMode 
                  ? "All items placed." 
                  : "Drag items here to remove from sequence."}
              </p>
            )}
          </div>
        </div>
        
        {/* Right side: Ordered Slots */}
        <div className="flex-1">
          <h3 className="font-medium mb-4">Ordered Sequence:</h3>
          <div className="space-y-2">
            {Array.from({ length: controller.getSlotCount() }).map((_, index) => {
              const slotKey = `slot_${index}`;
              const itemId = placedAnswers[slotKey];
              
              return (
                <motion.div
                  key={slotKey}
                  layout
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div
                    className={getSlotItemStyles(index, itemId)}
                    draggable={!isSubmitted && !isQuizReviewMode && itemId !== null}
                    onDragStart={(e) => itemId && handleDragStart(e, itemId)}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDropOnSlot(e, slotKey)}
                  >
                    <PositionIndicator position={index} />
                    
                    {itemId ? (
                      <div className="flex-1">
                        <span className="select-none">{getItemTextById(itemId)}</span>
                        {shouldShowFeedback() && (
                          <>
                            <FeedbackIcon isCorrect={controller.isItemCorrectlyPlacedInSlot(index, itemId)} />
                            {!controller.isItemCorrectlyPlacedInSlot(index, itemId) && controller.getCorrectItemForSlot(index) && (
                              <div className="absolute bottom-1 right-1 text-xs text-gray-500 p-1 bg-gray-100 rounded">
                                Correct: {getItemTextById(controller.getCorrectItemForSlot(index)!)}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 text-center">
                        <span className="text-gray-400">Drop item here</span>
                        {shouldShowFeedback() && controller.getCorrectItemForSlot(index) && (
                           <div className="absolute bottom-1 right-1 text-xs text-red-500 p-1 bg-red-50 rounded">
                             Should be: {getItemTextById(controller.getCorrectItemForSlot(index)!)}
                           </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {autoValidating && allItemsOrdered && (
        <div className="mt-4 p-2 border rounded bg-blue-50 text-blue-700">
          Auto-validating your answer... All slots filled.
        </div>
      )}
      
      {allItemsOrdered && !autoValidating && !isSubmitted && !showCorrectAnswer && (
        <div className="mt-4 p-2 border rounded bg-green-50 text-green-700">
          All slots filled. Ready to submit!
        </div>
      )}
      
      {shouldShowFeedback() && <CorrectOrderDisplay />}
      
      <style jsx global>{`
        .drag-over {
          @apply border-blue-400 bg-blue-50 shadow-md;
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default memo(OrderQuestionComponent);
