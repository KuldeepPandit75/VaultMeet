import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { API } from "../../service/api.js";
import { setNotification, setUser } from "../../features/slice.js";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [noti, setNoti] = useState("");
  const [notiType, setNotiType] = useState("");

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Use the token to fetch user info
        const { access_token } = tokenResponse;

        Cookies.set("access_token", access_token, { expires: 1, path: "" });

        const userInfoResponse = await axios.get(
          "https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
          { headers: { Authorization: `Bearer ${access_token}` } }
        );

        const userInfo = userInfoResponse.data;
        const response = await API.login({ data: userInfo });
        console.log(response);
        if (response.isSuccess) {
          console.log("User Info:", response.data);

          // Dispatch user info to Redux
          dispatch(setUser(response.data));

          // Store user info in session storage (optional)
          sessionStorage.setItem("user", JSON.stringify(response.data));

          // Navigate to home or dashboard
          navigate("/");
        } else {
          setNoti("Login Failed! Retry after 40-50 sec.");
          setNotiType("Failed");
          dispatch(setUser(false));
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    },
    onError: (error) => {
      console.error("Login Failed:", error);
    },
  });

  useEffect(() => {
    if (noti && notiType) {
      dispatch(setNotification({ noti, notiType }));
    }
  }, [noti]);

  return (
    <>
      <div className="overflow-hidden h-[100vh] bg-[url('/1355025.jpeg')] bg-cover bg-left-bottom ">
        <div className="absolute inset-0 bg-[#111111b3]"></div>
        <div className="bg-[#AF8D86] h-[40vh] w-[30vw] z-1 relative rounded-3xl top-[50vh] left-[50vw] -translate-x-[50%] -translate-y-[50%] flex justify-around text-center !p-10 flex-col items-center">
          <h1 className="font-extrabold text-3xl w-[50%]">
            Welcome to VaultMeet
          </h1>

          <img src="/google.png" className="h-10" alt="Google logo" onClick={()=>{login()}} />
        </div>
      </div>
    </>
  );
}

export default LoginPage;
