"use client";

import { ReactNode, useEffect, useState } from "react";
import MobileWarning from "@/components/Game/Warnings/MobileWarning";
import { usePathname } from "next/navigation";

const isGameTab = (path: string) => {
  const homeTabs = ["/room","/event-space"];
  return homeTabs.some((tab) => path.includes(tab));
};

const isMobileDevice = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    "android",
    "webos",
    "iphone",
    "ipad",
    "ipod",
    "blackberry",
    "windows phone",
    "opera mini",
    "mobile",
    "samsung",
    "lg",
    "huawei",
  ];
  return (
    mobileKeywords.some((keyword) => userAgent.includes(keyword)) ||
    (navigator.maxTouchPoints > 0)
  );
};

const MobileWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [showWarning, setShowWarning] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const check = () => {
      const isMobile = isMobileDevice();
      const isSmallScreen = window.innerWidth <= 768;
      setShowWarning(isMobile || isSmallScreen);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  if (showWarning && isGameTab(pathname)) {
    return <MobileWarning />;
  }

  return <>{children}</>;
};

export default MobileWrapper; 