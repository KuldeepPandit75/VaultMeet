
function Header() {
  return (
    <div className="flex justify-between ">
      <div className="flex items-center gap-8">
        <img src="/Asset 2.png" className="h-10" />
        <h1 className="text-2xl font-bold text-white">
          VaultMeet
        </h1>
      </div>
      <div className="w-[15vw] flex justify-between text-xl">
        <a href="#" className="text-white">About Us</a>
        <a href="#" className="text-[#AF8D86]">Contact Us</a>
      </div>
    </div>
  );
}

export default Header;
