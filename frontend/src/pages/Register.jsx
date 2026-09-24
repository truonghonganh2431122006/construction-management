import { useState } from "react";
import axios from "axios";

import {
    Form,
    Input,
    Button,
    Select,
    message
} from "antd";


import {
    UserOutlined,
    MailOutlined,
    LockOutlined
} from "@ant-design/icons";


import {
    Link
} from "react-router-dom";


import "../styles/Login.css";



function Register(){

    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    const handleRegister = async (values)=>{
        if (loading) return;
        setLoading(true);
        try {
            const { data } = await axios.post("/auth/register", {
                fullname: values.fullName.trim(),
                email: values.email.trim(),
                password: values.password,
                role: values.role
            }, { timeout: 15000 });
            messageApi.success(data.message || "Đăng ký tài khoản thành công");
            form.resetFields();
        } catch (error) {
            const serverMessage = error.response?.data?.message;
            messageApi.error(typeof serverMessage === "string"
                ? serverMessage
                : "Không thể kết nối máy chủ. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };



    return (

        <div className="login-container">

            {contextHolder}

            <div className="overlay"></div>



            {/* BÊN TRÁI */}

            <div className="brand">
            </div>

            {/* FORM ĐĂNG KÝ */}

            <div className="login-card">


                <h2>
                    Đăng ký
                </h2>


                <p className="subtitle">

                    Tạo tài khoản quản lý công trình

                </p>




                <Form

                    form={form}

                    layout="vertical"

                    onFinish={handleRegister}

                >



                    <Form.Item

                        label="Họ và tên"

                        name="fullName"

                        rules={[
                            {
                                required:true,
                                message:"Nhập họ tên",
                                whitespace:true
                            },
                            {
                                max:255,
                                message:"Họ tên không được vượt quá 255 ký tự"
                            }
                        ]}

                    >


                        <Input

                            size="large"

                            prefix={
                                <UserOutlined/>
                            }

                            placeholder="Nguyễn Văn A"

                        />


                    </Form.Item>





                    <Form.Item

                        label="Email"

                        name="email"

                        rules={[
                            {
                                required:true,
                                message:"Nhập email"
                            },
                            {
                                type:"email",
                                message:"Email không hợp lệ"
                            },
                            {
                                max:255,
                                message:"Email không được vượt quá 255 ký tự"
                            }
                        ]}

                    >


                        <Input

                            size="large"

                            prefix={
                                <MailOutlined/>
                            }

                            placeholder="example@gmail.com"

                        />


                    </Form.Item>





                    <Form.Item

                        label="Mật khẩu"

                        name="password"

                        rules={[
                            {
                                required:true,
                                message:"Nhập mật khẩu"
                            },
                            {
                                min:8,
                                message:"Mật khẩu phải có ít nhất 8 ký tự"
                            }
                        ]}

                    >


                        <Input.Password

                            size="large"

                            prefix={
                                <LockOutlined/>
                            }

                            placeholder="********"

                        />


                    </Form.Item>





                    <Form.Item

                        label="Xác nhận mật khẩu"

                        name="confirmPassword"

                        dependencies={[
                            "password"
                        ]}

                        rules={[
                            {
                                required:true,
                                message:"Nhập lại mật khẩu"
                            },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue("password") === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error("Mật khẩu xác nhận không khớp"));
                                }
                            })
                        ]}

                    >


                        <Input.Password

                            size="large"

                            prefix={
                                <LockOutlined/>
                            }

                            placeholder="********"

                        />


                    </Form.Item>





                    <Form.Item

                        label="Vai trò"

                        name="role"

                        rules={[{ required:true, message:"Vui lòng chọn vai trò" }]}

                    >


                        <Select

                            size="large"

                            placeholder="Chọn vai trò"

                            options={[
                                {
                                    value:"engineer",
                                    label:"Kỹ sư"
                                },
                                {
                                    value:"worker",
                                    label:"Công nhân"
                                },
                                {
                                    value:"viewer",
                                    label:"Người xem"
                                }
                            ]}


                        />


                    </Form.Item>





                    <Button

                        type="primary"

                        htmlType="submit"

                        loading={loading}

                        size="large"

                        block

                    >

                        Đăng ký


                    </Button>





                </Form>




                <div className="register-link">


                    Đã có tài khoản?


                    <Link to="/login">

                        {" "}Đăng nhập

                    </Link>


                </div>



            </div>


        </div>


    );


}


export default Register;
