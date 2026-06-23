import logo from "../../assets/brand-assets/logo.jpg";

function OceanLogo({ size = 32 }: { size?: number }) {
  return (
    <img
      src={logo}
      alt="OceanOS"
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
    />
  );
}

export default OceanLogo;
