import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  affected_table: string;
  affected_id: string;
  note: string;
  created_at: string;
}

export const AdminActionLogs = () => {
  const [logs, setLogs] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_actions_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Failed to fetch action logs");
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeVariant = (actionType: string) => {
    if (actionType.includes("delete") || actionType.includes("remove")) return "destructive";
    if (actionType.includes("create") || actionType.includes("add")) return "default";
    return "secondary";
  };

  if (loading) {
    return (
      <Card className="glass-card border-border/50 p-8">
        <div className="text-center text-muted-foreground">Loading action logs...</div>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-border/50 rounded-lg shadow-glow">
      <div className="p-6 border-b border-border/50">
        <h2 className="text-xl font-semibold text-foreground">Admin Action Logs</h2>
        <p className="text-sm text-muted-foreground mt-1">View all administrative actions</p>
      </div>
      
      <ScrollArea className="h-[600px]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-muted/5">
                <TableHead className="text-foreground">Date & Time</TableHead>
                <TableHead className="text-foreground">Action Type</TableHead>
                <TableHead className="text-foreground">Table</TableHead>
                <TableHead className="text-foreground">Admin ID</TableHead>
                <TableHead className="text-foreground">Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No action logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="border-border/30 hover:bg-muted/5">
                    <TableCell className="font-mono text-sm text-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action_type)} className="font-mono">
                        {log.action_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {log.affected_table}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.admin_id?.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-sm text-foreground max-w-md truncate">
                      {log.note || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </Card>
  );
};