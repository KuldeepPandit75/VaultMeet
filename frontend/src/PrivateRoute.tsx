import { Navigate } from "react-router-dom";
import { getAccessToken } from "./utils/common-utils.js";
import { useEffect, useState } from "react";
import Loader from "./components/loader/Loader"
import axios from "axios";

const PrivateRoute = ({ children }) => {
    const [valid, setValid] = useState(null);
    const accessToken = getAccessToken();

    useEffect(() => {
        const googleTokenInfoUrl = `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`;

        const validateToken=async()=>{
            try {
                let response=await axios.get(googleTokenInfoUrl);
                setValid(true);
            } catch (error) {
                setValid(false)
                console.log("invalid token")
            }
        }
        validateToken();
    },[accessToken])

    if(valid===null){
        return <Loader/>
    }

    return valid ? children : <Navigate to="/login" />;
};

export default PrivateRoute; 