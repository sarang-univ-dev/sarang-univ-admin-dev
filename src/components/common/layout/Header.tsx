import MobileSidebarToggle from "@/components/common/layout/MobileSidebarToggle";

const Header = () => {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-white shadow-sm">
      <div className="md:hidden">
        <MobileSidebarToggle />
      </div>
      <h1 className="text-lg font-bold">관리자 페이지</h1>
      <div className="w-8" />
    </header>
  );
};

export default Header;
