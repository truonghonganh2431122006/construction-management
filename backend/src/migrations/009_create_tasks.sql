CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    wbs_node_id INTEGER NOT NULL
        CONSTRAINT tasks_wbs_node_id_fkey REFERENCES work_items(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tasks_duration_positive CHECK (duration > 0)
);

CREATE INDEX tasks_wbs_node_id_idx ON tasks (wbs_node_id);
