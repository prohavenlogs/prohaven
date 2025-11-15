import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PageTransition from "@/components/PageTransition";
import LoadingSpinner from "@/components/LoadingSpinner";

const Profile = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else if (data) {
        setFullName(data.full_name || "");
        setEmail(data.email || user.email || "");
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, email: email })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout balance="0.00">
        <PageTransition>
          <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        </PageTransition>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout balance="0.00">
      <PageTransition>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <h1 className="text-3xl font-bold text-card-foreground mb-6">Profile Settings</h1>

          <Card className="rounded-3xl shadow-card p-8 border border-border/20">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-muted-foreground">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 rounded-full"
                  aria-label="Full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-full"
                  aria-label="Email address"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Account ID</Label>
                <Input
                  value={user?.id || ""}
                  disabled
                  className="h-12 rounded-full bg-muted border-0 text-muted-foreground"
                  aria-label="Account ID (read-only)"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full h-12 rounded-full gradient-primary text-black font-semibold shadow-glow relative overflow-hidden group"
                aria-label="Save profile changes"
              >
                {isSaving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Saving...</span>
                  </>
                ) : (
                  "Save Changes"
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              </Button>
            </div>
          </Card>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
};

export default Profile;
