ALTER TABLE tasks
    ADD COLUMN actual_start_date DATE,
    ADD COLUMN actual_end_date DATE,
    ADD COLUMN percent_complete INTEGER NOT NULL DEFAULT 0
        CONSTRAINT tasks_percent_complete_check CHECK (percent_complete BETWEEN 0 AND 100),
    ADD CONSTRAINT tasks_actual_dates_order_check CHECK (
        actual_start_date IS NULL
        OR actual_end_date IS NULL
        OR actual_end_date >= actual_start_date
    );
