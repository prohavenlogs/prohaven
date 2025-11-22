import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "sonner";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash or query parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);

        // Check for error in URL
        const errorDescription = hashParams.get("error_description") || queryParams.get("error_description");
        if (errorDescription) {
          setError(errorDescription);
          toast.error(errorDescription);
          setTimeout(() => navigate("/"), 3000);
          return;
        }

        // Get the current session - Supabase should have processed the tokens
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          setError(sessionError.message);
          toast.error("Failed to verify your email. Please try again.");
          setTimeout(() => navigate("/"), 3000);
          return;
        }

        if (session) {
          // User is logged in after email verification
          toast.success("Email verified successfully! Welcome to ProHaven.");
          navigate("/dashboard", { replace: true });
        } else {
          // No session, but email might have been verified
          // Check if this is a signup confirmation
          const type = hashParams.get("type") || queryParams.get("type");

          if (type === "signup" || type === "email") {
            toast.success("Email verified! Please sign in to continue.");
            navigate("/", { replace: true });
          } else {
            // Unknown state, redirect to login
            navigate("/", { replace: true });
          }
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("An unexpected error occurred");
        setTimeout(() => navigate("/"), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-red-400 text-lg">{error}</div>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">Verifying your email...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
