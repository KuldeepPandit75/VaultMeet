"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import gsap from "gsap";
import Footer from "@/components/Footer/Footer";
import Navbar from "@/components/Navbar/Navbar";

const NotFound = () => {
  const router = useRouter();
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();
  
  // Refs for animation elements
  const numberRef = useRef(null);
  const lineRef = useRef(null);
  const textRef = useRef(null);
  const buttonsRef = useRef(null);
  const circlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create timeline for sequential animations
    const tl = gsap.timeline();

    // Animate 404 number
    tl.from(numberRef.current, {
      scale: 0.5,
      opacity: 0,
      duration: 0.5,
      ease: "back.out(1.7)"
    });

    // Animate line
    tl.from(lineRef.current, {
      x: -100,
      opacity: 0,
      duration: 0.5,
      ease: "power2.out"
    }, "-=0.2");

    // Animate text
    tl.from(textRef.current, {
      y: 20,
      opacity: 0,
      duration: 0.5,
      ease: "power2.out"
    }, "-=0.2");

    // Animate buttons
    tl.from(buttonsRef.current, {
      y: 20,
      opacity: 0,
      duration: 0.5,
      ease: "power2.out"
    }, "-=0.2");

    // Animate circles
    tl.from(circlesRef.current, {
      scale: 0,
      opacity: 0,
      duration: 0.5,
      ease: "back.out(1.7)"
    }, "-=0.2");

    // Rotating circles animation
    const circles = circlesRef.current?.children;
    if (circles) {
      gsap.to(circles[0], {
        rotation: 360,
        duration: 20,
        repeat: -1,
        ease: "none"
      });
      gsap.to(circles[1], {
        rotation: -360,
        duration: 15,
        repeat: -1,
        ease: "none"
      });
      gsap.to(circles[2], {
        rotation: 360,
        duration: 10,
        repeat: -1,
        ease: "none"
      });
    }

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <>
    <Navbar />
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div ref={numberRef} className="relative">
          <h1 
            className="text-[150px] font-bold leading-none"
            style={{ color: primaryAccentColor }}
            >
            404
          </h1>
          <div
            ref={lineRef}
            className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-3/4 h-2 rounded-full"
            style={{ backgroundColor: secondaryAccentColor }}
            />
        </div>

        <div ref={textRef} className="mt-8">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-white mb-4">
            Oops! Page Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track!
          </p>
        </div>

        <div ref={buttonsRef} className="space-x-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
            >
            Go Back
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-xl text-white transition-all duration-200"
            style={{ backgroundColor: primaryAccentColor }}
            >
            Go Home
          </button>
        </div>

        <div ref={circlesRef} className="mt-12">
          <div className="relative w-24 h-24 mx-auto">
            <div
              className="absolute inset-0 border-4 border-dashed rounded-full"
              style={{ borderColor: secondaryAccentColor }}
              />
            <div
              className="absolute inset-4 border-4 border-dashed rounded-full"
              style={{ borderColor: primaryAccentColor }}
              />
            <div
              className="absolute inset-8 border-4 border-dashed rounded-full"
              style={{ borderColor: secondaryAccentColor }}
              />
          </div>
        </div>
      </div>
    </div>
    <Footer />
              </>
  );
};

export default NotFound;