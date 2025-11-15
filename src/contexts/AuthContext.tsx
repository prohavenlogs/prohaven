import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAccount, useDisconnect } from "wagmi";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  walletAddress: string | null;
  loading: boolean;
  signUpWithWallet: (walletAddress: string, email: string, fullName: string) => Promise<{ error: any }>;
  signInWithWallet: (walletAddress: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        setWalletAddress(session?.user?.user_metadata?.wallet_address ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setWalletAddress(session?.user?.user_metadata?.wallet_address ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync wallet connection with auth state
  useEffect(() => {
    if (isConnected && address) {
      setWalletAddress(address);
    } else if (!isConnected) {
      setWalletAddress(null);
    }
  }, [isConnected, address]);

  const signUpWithWallet = async (walletAddress: string, email: string, fullName: string) => {
    try {
      // Check if wallet address is already registered by querying profiles table
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('wallet_address', walletAddress.toLowerCase())
        .maybeSingle();

      // Only block if we found a confirmed profile (ignore check errors or missing table)
      if (existingProfile && !checkError) {
        return {
          error: {
            message: "This wallet address is already registered. Please sign in instead."
          }
        };
      }

      // Create a deterministic password from wallet address only (no timestamp)
      // This ensures the same password can be used for signin
      const password = `wallet_auth_${walletAddress.toLowerCase()}_prohaven`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            wallet_address: walletAddress.toLowerCase(),
          },
        },
      });

      if (error) {
        // Handle duplicate email error
        if (error.message.includes("already registered") || error.message.includes("already been registered")) {
          return {
            error: {
              message: "This email is already registered with another wallet. Please use a different email."
            }
          };
        }
        return { error };
      }

      // Store wallet address in profiles table
      if (data?.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: email,
          full_name: fullName,
          wallet_address: walletAddress.toLowerCase(),
          wallet_balance: 0,
        }, {
          onConflict: 'id'
        });
      }

      // Check if email confirmation is required
      if (data?.user && !data.session) {
        // Email confirmation is required - this is not an error
        return {
          error: null,
          needsEmailConfirmation: true,
          email: email
        };
      }

      // Auto sign in after signup (only if email confirmation is not required)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error: signInError };
    } catch (error: any) {
      return { error };
    }
  };

  const signInWithWallet = async (walletAddress: string) => {
    try {
      // Check if user exists with this wallet address
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('email')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single();

      if (fetchError || !profile) {
        return { error: { message: "Wallet not registered. Please sign up first." } };
      }

      // Use the same deterministic password as signup
      const password = `wallet_auth_${walletAddress.toLowerCase()}_prohaven`;

      const { error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password,
      });

      // If error is about email confirmation, provide helpful message
      if (error) {
        if (error.message.includes("Email not confirmed") || error.message.includes("not confirmed")) {
          return {
            error: {
              message: "Please check your email and click the confirmation link to verify your account before signing in."
            }
          };
        }
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    disconnect();
    setWalletAddress(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, walletAddress, loading, signUpWithWallet, signInWithWallet, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
