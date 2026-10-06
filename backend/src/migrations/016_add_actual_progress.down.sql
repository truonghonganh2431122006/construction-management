LOCK TABLE tasks IN ACCESS EXCLUSIVE MODE;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM tasks
        WHERE actual_start_date IS NOT NULL OR actual_end_date IS NOT NULL OR percent_complete > 0
    ) THEN
        RAISE EXCEPTION 'Cannot rollback actual progress: tasks contain actual progress data.';
    END IF;
END;
$$;

ALTER TABLE tasks
    DROP CONSTRAINT tasks_actual_dates_order_check,
    DROP CONSTRAINT tasks_percent_complete_check,
    DROP COLUMN actual_start_date,
    DROP COLUMN actual_end_date,
    DROP COLUMN percent_complete;
