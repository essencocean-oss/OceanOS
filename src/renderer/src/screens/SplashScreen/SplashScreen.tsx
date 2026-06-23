import { useEffect, useRef } from "react";
import startVid from "../../assets/startvid.mp4";
import splashLogo from "../../assets/oceanos-logo.jpg";

interface SplashScreenProps {
  onFinished: () => void;
  status?: string;
}

function SplashScreen({
  onFinished,
  status,
}: SplashScreenProps): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    onFinished();
  }, [onFinished]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = 1;
    video.play().catch(() => {
      // autoplay blocked or video error — silently fall back to black bg
    });
  }, []);

  return (
    <div className="splash-screen">
      <video
        ref={videoRef}
        className="splash-bg"
        src={startVid}
        muted
        loop
        playsInline
        preload="none"
        style={{ display: "block", objectFit: "cover" }}
      />
      <img className="splash-logo" src={splashLogo} alt="OceanOS" />
      {status && <div className="splash-status">{status}</div>}
    </div>
  );
}

export default SplashScreen;
