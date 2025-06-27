import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone, faMicrophoneSlash, faVideo, faVideoSlash, faMessage } from "@fortawesome/free-solid-svg-icons";
import useAuthStore from "@/Zustand_Store/AuthStore";

interface ControlBarProps {
  mic: boolean;
  video: boolean;
  handleMicToggle: () => void;
  handleVideoToggle: () => void;
  setBox: (box: (prev: boolean) => boolean) => void;
}

export const ControlBar = ({ mic, video, handleMicToggle, handleVideoToggle, setBox }: ControlBarProps) => {
  const {user} = useAuthStore();

  return (
    <div className="absolute z-50 w-[100vw] h-[60px] bg-[#111] bottom-0 right-0 flex justify-between items-center !px-10">
        <div className="flex gap-10 items-center">
          <div className="relative">
            <video
              className="video-player h-12 w-20 bg-black rounded-sm"
              style={{display: video ? 'block' : 'none'}}
              id="user-1"
              autoPlay
              muted
              playsInline
            ></video>
            {!video && (
              <div className="h-10 w-20 bg-black flex justify-center items-center rounded-sm">
                <p className="text-white text-sm p-2 h-6 w-6 flex items-center justify-center bg-gray-400 rounded-full">
                  {user?.fullname?.firstname.charAt(0)}
                </p>
              </div>
            )}
          </div>
          {mic ? (
            <button
              className="h-8 w-8 hover:bg-[#bfbfbf55] rounded-[50%]"
              onClick={handleMicToggle}
            >
              <FontAwesomeIcon icon={faMicrophone} className="text-white" />
            </button>
          ) : (
            <button
              className="h-8 w-8 hover:bg-[#bfbfbf55] rounded-[50%]"
              onClick={handleMicToggle}
            >
              <FontAwesomeIcon
                icon={faMicrophoneSlash}
                className="text-red-500"
              />
            </button>
          )}
          {video ? (
            <button
              className="h-8 w-8 hover:bg-[#bfbfbf55] rounded-[50%]"
              onClick={handleVideoToggle}
            >
              <FontAwesomeIcon icon={faVideo} className="text-white" />
            </button>
          ) : (
            <button
              className="h-8 w-8 hover:bg-[#bfbfbf55] rounded-[50%]"
              onClick={handleVideoToggle}
            >
              <FontAwesomeIcon icon={faVideoSlash} className="text-red-500" />
            </button>
          )}
          <button
            className="h-8 w-8 hover:bg-[#bfbfbf55] rounded-[50%]"
            onClick={() => setBox((prev: boolean) => !prev)}
          >
            <FontAwesomeIcon icon={faMessage} className="text-white" />
          </button>
        </div>
        <div className="homeBtn h-12 w-12 flex justify-center items-center rounded-[50%] cursor-pointer scale-[0.9] hover:scale-[1] transition-all duration-200 hover:shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            x="0px"
            y="0px"
            width="30"
            height="30"
            viewBox="0 0 64 64"
            fill="#fff"
          >
            <path d="M 32 8 C 31.08875 8 30.178047 8.3091875 29.435547 8.9296875 L 8.8007812 26.171875 C 8.0357812 26.810875 7.7634844 27.925203 8.2714844 28.783203 C 8.9184844 29.875203 10.35025 30.088547 11.28125 29.310547 L 12 28.710938 L 12 47 C 12 49.761 14.239 52 17 52 L 47 52 C 49.761 52 52 49.761 52 47 L 52 28.712891 L 52.71875 29.3125 C 53.09275 29.6255 53.546047 29.777344 53.998047 29.777344 C 54.693047 29.777344 55.382672 29.416656 55.763672 28.722656 C 56.228672 27.874656 55.954891 26.803594 55.212891 26.183594 L 52 23.498047 L 52 15 C 52 13.895 51.105 13 50 13 L 48 13 C 46.895 13 46 13.895 46 15 L 46 18.484375 L 34.564453 8.9296875 C 33.821953 8.3091875 32.91125 8 32 8 z M 32 12.152344 C 32.11475 12.152344 32.228766 12.191531 32.322266 12.269531 L 48 25.369141 L 48 46 C 48 47.105 47.105 48 46 48 L 38 48 L 38 34 C 38 32.895 37.105 32 36 32 L 28 32 C 26.895 32 26 32.895 26 34 L 26 48 L 18 48 C 16.895 48 16 47.105 16 46 L 16 25.367188 L 31.677734 12.269531 C 31.771234 12.191531 31.88525 12.152344 32 12.152344 z"></path>
          </svg>
        </div>
      </div>
  );
};