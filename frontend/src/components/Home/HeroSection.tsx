'use client';

import { useThemeStore } from '../../Zustand_Store/ThemeStore';
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import TypingText from '../Misc/TypingText';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/Zustand_Store/AuthStore';

export default function HeroSection() {
  const { primaryAccentColor, secondaryAccentColor } = useThemeStore();
  const {user} =useAuthStore();
  const router = useRouter();

  const words = [
    "Build.",
    "Connect.",
    "Compete.",
    "All in One Place."
  ];

  const handleCodSpaceClick=()=>{
    if(user){
      router.push('/coding-space')
    }else{
      router.push('login')
    }
  }

  return (
    <section className="flex flex-col-reverse md:flex-row items-center justify-between min-h-[60vh] px-8 lg:px-[80px] md:py-[80px] overflow-hidden" >
      <div className="w-full md:min-w-[70%] text-center md:text-left">
        <h1 
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 md:mb-6"
          style={{ color: secondaryAccentColor }}
        >
          Host & Join Events in a <br /> 2D Virtual World
        </h1>
        <h2
          className="text-xl sm:text-2xl font-semibold mb-6 md:mb-8"
          style={{ color: primaryAccentColor }}
        >
          <TypingText 
            words={words}
            typingSpeed={50}
            deletingSpeed={20}
            pauseTime={2000}
          />
        </h2>
        <div className="flex flex-col sm:flex-row gap-8 md:gap-8 items-center mt-10 mb-10 md:mb-0">
          <button
            className="w-full sm:w-auto rounded-lg px-6 py-3 text-lg md:text-xl font-bold shadow cursor-pointer"
            style={{
              background: `linear-gradient(90deg, ${secondaryAccentColor} 0%, ${primaryAccentColor} 100%)`,
              color: '#222',
            }}
            onClick={() => router.push('/events')}
          >
            Explore Events
          </button>
          <button
            className="text-lg md:text-xl font-semibold cursor-pointer"
            style={{ color: secondaryAccentColor }}
            onClick={handleCodSpaceClick}
          >
            Coding Space
          </button>
        </div>
      </div>
      <div className="flex-1 flex justify-center mt-10 md:mt-0">
        <DotLottieReact
          src="https://lottie.host/1e0079e8-968c-4031-b0a9-e4ecd2a624fa/o1rNbfSexs.lottie"
          loop
          autoplay
          className='w-[300px] sm:w-[350px] md:w-[400px] mb-10 md:mb-0 h-[300px] sm:h-[350px] md:h-[400px] md:ml-[-100px]'
        />
      </div>
    </section>
  );
} 