import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ADMIN_EMAIL = "prohavenlogs@gmail.com";

export const useAdminCheck = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Check if user email matches admin email
        const userEmail = user.email?.toLowerCase();
        const isEmailAdmin = userEmail === ADMIN_EMAIL.toLowerCase();

        if (isEmailAdmin) {
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        // Fallback: check via RPC and user_roles table (for backward compatibility)
        let isAdminFlag = false;
        let rpcError: any = null;

        // Primary: secure RPC function
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        if (error) {
          console.error("Error checking admin status via RPC:", error);
          rpcError = error;
        } else {
          isAdminFlag = !!data;
        }

        // Fallback: direct table read if RPC fails
        if (!isAdminFlag && rpcError) {
          const { data: roleRow, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .maybeSingle();

          if (roleError) {
            console.error('Fallback role check error:', roleError);
          } else {
            isAdminFlag = !!roleRow;
          }
        }

        setIsAdmin(isAdminFlag);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user]);

  return { isAdmin, loading };
};
