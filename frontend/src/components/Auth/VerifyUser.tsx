"use client"
import { useEffect } from "react";
import useAuthStore from "@/Zustand_Store/AuthStore";

export default function VerifyUser() {
  const { verifyUser,user,loading } = useAuthStore();

  useEffect(() => {
    if (user && !loading) {
      verifyUser();
      // console.log("user",user);
    }
  }, []);

  return <></>;
}