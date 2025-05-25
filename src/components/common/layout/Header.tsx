import SidebarToggleButton from "@/components/common/layout/SidebarToggle";

const Header = () => {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-white shadow-sm">
      <SidebarToggleButton />
      <h1 className="text-lg font-bold">관리자 페이지</h1>
      <div className="w-8" />
    </header>
  );
};

export default Header;
