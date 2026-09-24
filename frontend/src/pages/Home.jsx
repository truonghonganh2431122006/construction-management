import { Button, Card } from "antd";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

function Home() {

    const navigate = useNavigate();

    const user = JSON.parse(
        localStorage.getItem("user")
    );


    const handleLogout = () => {

        localStorage.removeItem("user");

        navigate("/login");

    };


    return (

        <div className="home-container">

            <Card className="home-card">

                <h1>
                    Hệ thống quản lý công trình
                </h1>


                <h2>
                    Xin chào:
                    {" "}
                    {user?.fullname || "Người dùng"}
                </h2>


                <p>
                    Vai trò:
                    {" "}
                    {user?.role || "Chưa xác định"}
                </p>


                <Button
                    danger
                    onClick={handleLogout}
                >
                    Đăng xuất
                </Button>


            </Card>

        </div>

    );

}


export default Home;