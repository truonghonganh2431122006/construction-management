import { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Login.css";

function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (values) => {
    setLoading(true);

    try {
      const { data } = await axios.post(
        "/auth/login",
        {
          email: values.email.trim(),
          password: values.password,
        },
        {
          timeout: 15000,
          withCredentials: true,
        },
      );

      if (!Number.isInteger(data?.user?.id) || data.user.id <= 0) {
        message.error("Phản hồi đăng nhập không hợp lệ. Vui lòng thử lại.");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      message.success(data.message || "Đăng nhập thành công");
      navigate("/home");
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      message.error(
        typeof serverMessage === "string"
          ? serverMessage
          : "Không thể đăng nhập. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="overlay"></div>
      <div className="brand"></div>

      <div className="login-card">
        <h2>Đăng nhập</h2>
        <p className="subtitle">Truy cập hệ thống quản lý công trình</p>

        <Form layout="vertical" onFinish={handleLogin}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input
              size="large"
              prefix={<MailOutlined />}
              placeholder="example@gmail.com"
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: "Nhập mật khẩu" }]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="••••••••"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            block
          >
            Đăng nhập
          </Button>
        </Form>

        <div className="register-link">
          Chưa có tài khoản?
          <Link to="/register">{" "}Đăng ký</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
