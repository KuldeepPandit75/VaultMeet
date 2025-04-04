import Header from "../Header/Header";
import { useNavigate } from "react-router-dom";

function Home() {

  const navigate=useNavigate();

  const opengame=()=>{
    navigate('/meta')
  }

  return (
    <div className="bg-[#111] min-h-[100vh] w-[100vw] !pt-8 !px-16">
      <Header />
      <div className="text-white flex justify-around items-center h-[80vh]">
        <div className="text-center">
          <div className="slogan text-[5vw]">
            <h1 className="inline">Meet. &nbsp;</h1>
            <h1 className="inline text-[#AF8D86]">Greet. &nbsp;</h1>
            <h1 className="inline">Repeat.</h1>
          </div>
          <p>Not a Quest — Just a Place to Rest & Chat.</p>
          <button className="bg-[#AF8D86] !py-1 !px-4 rounded-sm !mt-5" onClick={opengame}>Explore VaultMeet</button>
        </div>
        <img src="/meta_preview.png" alt="meta preview" className="h-[20vw] rounded-lg"/>
      </div>
    </div>
  );
}

export default Home;
