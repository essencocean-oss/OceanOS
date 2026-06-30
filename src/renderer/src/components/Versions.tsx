import { useState } from "react";
import { tauri } from "../shared/tauri";

function Versions(): React.JSX.Element {
  const [appVersion, setAppVersion] = useState<string>("…");
  const [platform, setPlatform] = useState<string>(() =>
    typeof navigator !== "undefined" && navigator.userAgent
      ? navigator.userAgent
      : "unknown",
  );

  useState(() => {
    tauri.getAppVersion().then((v) => {
      if (typeof v === "string") setAppVersion(v);
    });
  });

  return (
    <ul className="versions">
      <li className="app-version">OceanOS v{appVersion}</li>
      <li className="platform-version">OS: {platform}</li>
    </ul>
  );
}

export default Versions;
