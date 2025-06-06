import HeroSection from '@/components/Home/HeroSection';
import WhyHackMeet from '@/components/Home/WhyHackMeet';
import ForParticipants from '@/components/Home/ForParticipants';
import ForOrganizers from '@/components/Home/ForOrganizers';
import CallToAction from '@/components/Home/CallToAction';

export default function Home() {
  return (
    <>
      <HeroSection />
      <WhyHackMeet />
      <ForParticipants />
      <ForOrganizers />
      <CallToAction />
    </>
  );
}
