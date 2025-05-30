-- Migration: Fix order_correct_order table schema
-- Date: 2025-05-30
-- Description: Add missing position column to order_correct_order table

BEGIN;

-- Check if the position column exists, if not add it
DO $$
BEGIN
    -- Check if position column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'order_correct_order' 
        AND column_name = 'position'
    ) THEN
        -- Add position column
        ALTER TABLE public.order_correct_order 
        ADD COLUMN position INTEGER;
        
        -- Add check constraint
        ALTER TABLE public.order_correct_order 
        ADD CONSTRAINT chk_position_positive CHECK (position >= 1);
        
        -- Update existing data if any exists
        -- Note: This assumes existing data needs to be re-ordered properly
        WITH ordered_items AS (
            SELECT 
                question_id,
                item_id,
                ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY item_id) as new_position
            FROM public.order_correct_order
            WHERE position IS NULL
        )
        UPDATE public.order_correct_order 
        SET position = ordered_items.new_position
        FROM ordered_items 
        WHERE public.order_correct_order.question_id = ordered_items.question_id 
        AND public.order_correct_order.item_id = ordered_items.item_id;
        
        -- Make position NOT NULL
        ALTER TABLE public.order_correct_order 
        ALTER COLUMN position SET NOT NULL;
        
        -- Recreate the UNIQUE constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE table_schema = 'public' 
            AND table_name = 'order_correct_order' 
            AND constraint_name = 'order_correct_order_question_id_position_key'
        ) THEN
            ALTER TABLE public.order_correct_order 
            ADD CONSTRAINT order_correct_order_question_id_position_key 
            UNIQUE (question_id, position);
        END IF;
        
        RAISE NOTICE 'Added position column to order_correct_order table';
    ELSE
        RAISE NOTICE 'Position column already exists in order_correct_order table';
    END IF;
END
$$;

COMMIT;
