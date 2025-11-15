import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";

const Orders = () => {
  return (
    <DashboardLayout balance="0.00">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="rounded-3xl shadow-card p-8 md:p-12 border border-border/20">
          <h1 className="text-3xl font-bold text-card-foreground mb-4">My Orders</h1>
          <p className="text-muted-foreground">Your order history will appear here.</p>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Orders;
