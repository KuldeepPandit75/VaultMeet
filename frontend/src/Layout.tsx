import { Outlet, useLocation } from "react-router-dom";
import Header from "./components/Header/Header";

function Layout() {
  const location = useLocation();

  return (
    <>
      {location.pathname == "/" ? <Header /> : null}

      <Outlet />
    </>
  );
}

export default Layout;
