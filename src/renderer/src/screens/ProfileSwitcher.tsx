export type ProfileSwitcherProps = {
  activeProfile?: string;
  onSwitch?: (profile: string) => void;
  onManage?: () => void;
};

export default function ProfileSwitcher({
  activeProfile,
  onManage,
}: ProfileSwitcherProps) {
  return (
    <div className="profile-switcher">
      <span>{activeProfile}</span>
      <button type="button" onClick={onManage}>
        Manage
      </button>
    </div>
  );
}
