import { useEffect, useState } from "react";
import { Alert, Form, Input, InputNumber, Modal, Select } from "antd";
import { createTask, updateTask } from "../services/taskApi";

export default function TaskModal({ open, task, wbsItems = [], defaultWbsNodeId, onCancel, onSuccess }) {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const isEdit = Boolean(task?.id);

    useEffect(() => {
        if (open) {
            if (task) {
                form.setFieldsValue({
                    name: task.name,
                    description: task.description || "",
                    duration: task.duration,
                    wbs_node_id: task.wbs_node_id
                });
            } else {
                form.resetFields();
                if (defaultWbsNodeId) {
                    form.setFieldsValue({ wbs_node_id: defaultWbsNodeId });
                }
            }
        }
    }, [open, task, defaultWbsNodeId, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            setErrorMessage("");

            const payload = {
                name: values.name.trim(),
                description: values.description ? values.description.trim() : null,
                duration: Number(values.duration),
                wbs_node_id: Number(values.wbs_node_id)
            };

            if (isEdit) {
                await updateTask(task.id, payload);
            } else {
                await createTask(payload);
            }

            form.resetFields();
            setErrorMessage("");
            onSuccess();
        } catch (error) {
            if (error.errorFields) {
                // Antd client validation error, already shown in form items
                return;
            }
            setErrorMessage(error.response?.data?.message || "Không thể lưu công việc");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        setErrorMessage("");
        onCancel();
    };

    // Build options for WBS selector where ONLY leaf nodes are selectable
    const wbsOptions = wbsItems.map((item) => {
        const hasChildren = wbsItems.some((other) => other.parent_id === item.id);
        const prefix = "— ".repeat(item.depth || 0);
        return {
            value: item.id,
            label: `${prefix}${item.title}${hasChildren ? " (Hạng mục cha - không thể chọn)" : " [Hạng mục lá]"}`,
            disabled: hasChildren
        };
    });

    return (
        <Modal
            title={isEdit ? "Chỉnh sửa công việc" : "Thêm công việc mới"}
            open={open}
            onOk={handleSubmit}
            onCancel={handleCancel}
            confirmLoading={submitting}
            okText={isEdit ? "Cập nhật" : "Tạo công việc"}
            cancelText="Hủy"
            destroyOnClose={false}
        >
            {errorMessage && (
                <Alert
                    type="error"
                    message={errorMessage}
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Tên công việc"
                    name="name"
                    rules={[
                        { required: true, message: "Tên công việc là bắt buộc" },
                        {
                            validator: (_, value) => {
                                if (value && !value.trim()) {
                                    return Promise.reject(new Error("Tên công việc không được để trống"));
                                }
                                return Promise.resolve();
                            }
                        }
                    ]}
                >
                    <Input placeholder="Nhập tên công việc (ví dụ: Thi công móng)" />
                </Form.Item>

                <Form.Item
                    label="Mô tả"
                    name="description"
                >
                    <Input.TextArea rows={3} placeholder="Mô tả chi tiết công việc" />
                </Form.Item>

                <Form.Item
                    label="Thời lượng (ngày làm việc)"
                    name="duration"
                    rules={[
                        { required: true, message: "Thời lượng là bắt buộc" },
                        {
                            validator: (_, value) => {
                                if (value === undefined || value === null || value === "") {
                                    return Promise.resolve();
                                }
                                const num = Number(value);
                                if (!Number.isInteger(num) || num < 1) {
                                    return Promise.reject(new Error("Thời lượng phải là số nguyên lớn hơn hoặc bằng 1."));
                                }
                                return Promise.resolve();
                            }
                        }
                    ]}
                >
                    <InputNumber
                        min={1}
                        step={1}
                        precision={0}
                        addonAfter="ngày làm việc"
                        style={{ width: "100%" }}
                        placeholder="Số ngày làm việc (nguyên dương, tối thiểu 1)"
                    />
                </Form.Item>

                <Form.Item
                    label="Hạng mục WBS (Chỉ được chọn hạng mục lá)"
                    name="wbs_node_id"
                    rules={[
                        { required: true, message: "Hạng mục WBS là bắt buộc" },
                        {
                            validator: (_, value) => {
                                if (!value) return Promise.resolve();
                                const target = wbsItems.find((i) => i.id === Number(value));
                                if (!target) {
                                    return Promise.reject(new Error("Hạng mục WBS không tồn tại."));
                                }
                                const isParent = wbsItems.some((i) => i.parent_id === target.id);
                                if (isParent) {
                                    return Promise.reject(new Error("Hạng mục đã chọn không phải là hạng mục lá."));
                                }
                                return Promise.resolve();
                            }
                        }
                    ]}
                >
                    <Select
                        placeholder="Chọn hạng mục WBS lá"
                        options={wbsOptions}
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}
