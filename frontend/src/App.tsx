import "./App.css";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import Canvas from "./components/Canvas/Canvas";
import Home from "./components/Home/Home";
import LoginPage from "./components/Login/LoginPage";
import Layout from "./Layout";
import PrivateRoute from './PrivateRoute'

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Layout />}>
          <Route path="/" element={<PrivateRoute><Home/></PrivateRoute>}/>
          <Route path="/meta" element={<Canvas />} />
        </Route>
      </>
    )
  );

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
