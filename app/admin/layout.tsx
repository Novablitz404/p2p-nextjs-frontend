import AppHeader from "@/components/layout/AppHeader";

export default function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout creates a full-height container below the header
  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <div className="flex-grow overflow-y-auto">
        {children}
      </div>
    </div>
  );
}