import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUser } from '../../features/slice';
import Cookies from 'js-cookie'


function Header() {

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logout = () => {
    console.log("Log out successfull!");
    dispatch(setUser(null));
    sessionStorage.clear();
    navigate("/login");
    Cookies.remove("access_token");
  }

  return (
    <div className="flex justify-between !pt-8 !px-16">
      <div className="flex items-center gap-8">
        <img src="/Asset 2.png" className="h-10" />
        <h1 className="text-2xl font-bold text-white">
          VaultMeet
        </h1>
      </div>
      <div className="w-[25vw] flex justify-between text-xl items-center">
        <a href="#" className="text-white">About Us</a>
        <a href="#" className="text-[#AF8D86]">Contact Us</a>
        <button className="bg-[#AF8D86] text-white !px-4 !py-1 rounded-sm" onClick={logout}>LogOut</button>
      </div>
    </div>
  );
}

export default Header;
