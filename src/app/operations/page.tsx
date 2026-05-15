import OperationsDashboard from "@/components/OperationsDashboard";

export const metadata = {
  title: "لوحة التحويل | الإقامة الآمنة",
  description: "لوحة تجريبية لترتيب leads حسب rejected / needs_documents / ready_deposit / submitted.",
};

export default function OperationsPage() {
  return <OperationsDashboard />;
}
