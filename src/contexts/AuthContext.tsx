import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAccount, useDisconnect } from "wagmi";

interface UserWallet {
  id: string;
  user_id: string;
  wallet_address: string;
  is_primary: boolean;
  nickname: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  walletAddress: string | null;
  userWallets: UserWallet[];
  loading: boolean;
  signUpWithWallet: (walletAddress: string, email: string, fullName: string) => Promise<{ error: any }>;
  signInWithWallet: (walletAddress: string) => Promise<{ error: any }>;
  linkWallet: (walletAddress: string, nickname?: string) => Promise<{ error: any; wallet_id?: string }>;
  unlinkWallet: (walletId: string) => Promise<{ error: any }>;
  setPrimaryWallet: (walletId: string) => Promise<{ error: any }>;
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
  const [userWallets, setUserWallets] = useState<UserWallet[]>([]);

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
  // Only update wallet address when connected, don't clear it on disconnect
  // This allows the wallet to persist across auth flows
  useEffect(() => {
    if (isConnected && address) {
      setWalletAddress(address);
    }
  }, [isConnected, address]);

  // Fetch user's linked wallets
  useEffect(() => {
    const fetchUserWallets = async () => {
      if (!user) {
        setUserWallets([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_wallets')
          .select('*')
          .eq('user_id', user.id)
          .order('is_primary', { ascending: false });

        if (error) throw error;
        setUserWallets(data || []);
      } catch (error) {
        console.error('Error fetching user wallets:', error);
        setUserWallets([]);
      }
    };

    fetchUserWallets();

    // Subscribe to changes in user_wallets
    const channel = supabase
      .channel('user_wallets_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_wallets',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchUserWallets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const signUpWithWallet = async (walletAddress: string, email: string, fullName: string) => {
    try {
      // Check if wallet address is already linked to any user
      const { data: existingWallet, error: checkError } = await supabase
        .from('user_wallets')
        .select('user_id')
        .eq('wallet_address', walletAddress.toLowerCase())
        .maybeSingle();

      // Block if wallet is already linked to another user
      if (existingWallet && !checkError) {
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

      // Store wallet address in profiles table and user_wallets table
      if (data?.user) {
        // Add wallet to user_wallets table as primary wallet first
        await supabase.from('user_wallets').insert({
          user_id: data.user.id,
          wallet_address: walletAddress.toLowerCase(),
          is_primary: true,
          nickname: 'Primary Wallet',
        });

        // Update profile with wallet address (trigger will sync this, but set it explicitly too)
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
      // Check if user exists with this wallet address in user_wallets table
      const { data: walletData, error: fetchError } = await supabase
        .from('user_wallets')
        .select('user_id, user:profiles(email)')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single();

      if (fetchError || !walletData || !walletData.user) {
        return { error: { message: "Wallet not registered. Please sign up first." } };
      }

      const profile = Array.isArray(walletData.user) ? walletData.user[0] : walletData.user;

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

  const linkWallet = async (walletAddress: string, nickname?: string) => {
    try {
      if (!user) {
        return { error: { message: "User not logged in" } };
      }

      const { data, error } = await supabase.rpc('link_wallet', {
        p_user_id: user.id,
        p_wallet_address: walletAddress.toLowerCase(),
        p_nickname: nickname || null,
        p_is_primary: false,
      });

      if (error) {
        if (error.message.includes('WALLET_ALREADY_LINKED_TO_YOU')) {
          return { error: { message: "This wallet is already linked to your account" } };
        } else if (error.message.includes('WALLET_ALREADY_LINKED_TO_ANOTHER_USER')) {
          return { error: { message: "This wallet is already linked to another account" } };
        }
        return { error };
      }

      return { error: null, wallet_id: data?.wallet_id };
    } catch (error: any) {
      return { error };
    }
  };

  const unlinkWallet = async (walletId: string) => {
    try {
      if (!user) {
        return { error: { message: "User not logged in" } };
      }

      // Check if this is the primary wallet
      const wallet = userWallets.find(w => w.id === walletId);
      if (wallet?.is_primary) {
        return { error: { message: "Cannot unlink primary wallet. Set another wallet as primary first." } };
      }

      const { error } = await supabase
        .from('user_wallets')
        .delete()
        .eq('id', walletId)
        .eq('user_id', user.id);

      if (error) return { error };
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const setPrimaryWallet = async (walletId: string) => {
    try {
      if (!user) {
        return { error: { message: "User not logged in" } };
      }

      const { error } = await supabase.rpc('set_primary_wallet', {
        p_wallet_id: walletId,
        p_user_id: user.id,
      });

      if (error) {
        if (error.message.includes('WALLET_NOT_FOUND')) {
          return { error: { message: "Wallet not found" } };
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
    <AuthContext.Provider value={{
      user,
      session,
      walletAddress,
      userWallets,
      loading,
      signUpWithWallet,
      signInWithWallet,
      linkWallet,
      unlinkWallet,
      setPrimaryWallet,
      signOut
    }}>
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
