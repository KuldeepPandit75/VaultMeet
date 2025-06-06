'use client';

import { useThemeStore } from '../../Zustand_Store/ThemeStore';
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function HeroSection() {
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();

  return (
    <section className="flex flex-col md:flex-row items-center justify-between min-h-[60vh] px-[80px] py-[80px]">
      <div className="min-w-[70%]">
        <h1
          className="text-5xl md:text-6xl font-extrabold mb-6"
          style={{ color: secondaryAccentColor }}
        >
          Host & Join Hackathons in a <br /> 2D Virtual World
        </h1>
        <h2
          className="text-2xl font-semibold mb-8"
          style={{ color: primaryAccentColor }}
        >
          Build. Connect. Compete. All in One Place.
        </h2>
        <div className="flex gap-8 items-center">
          <button
            className="rounded-lg px-6 py-3 text-xl font-bold shadow cursor-pointer"
            style={{
              background: `linear-gradient(90deg, ${secondaryAccentColor} 0%, ${primaryAccentColor} 100%)`,
              color: '#222',
            }}
          >
            Explore Hackathons
          </button>
          <span
            className="text-xl font-semibold cursor-pointer"
            style={{ color: secondaryAccentColor }}
          >
            Coding Space
          </span>
        </div>
      </div>
      <div className="flex-1 flex justify-center mt-10 md:mt-0">
        <DotLottieReact
          src="https://lottie.host/1e0079e8-968c-4031-b0a9-e4ecd2a624fa/o1rNbfSexs.lottie"
          loop
          autoplay
          className=' w-[400px] h-[400px] ml-[-100px]'
        />
      </div>
    </section>
  );
} 