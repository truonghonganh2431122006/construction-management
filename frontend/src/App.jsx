import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";


import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import WorkItems from "./pages/WorkItems";
import Schedule from "./pages/Schedule";


function App() {


    return (

        <BrowserRouter>

            <Routes>

                <Route 
                    path="/login"
                    element={<Login />}
                />


                <Route
                    path="/register"
                    element={<Register />}
                />


                <Route
                    path="/home"
                    element={<Home />}
                />

                <Route
                    path="/work-items"
                    element={<WorkItems />}
                />

                <Route path="/schedule" element={<Schedule />} />


            </Routes>


        </BrowserRouter>

    );

}


export default App;
