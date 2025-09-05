import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ActivityLog {
  activity_type: 'call_helpline' | 'report_sighting' | 'guidance';
  species?: string;
  ngo_name?: string;
  ngo_phone?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export function useActivityLogger() {
  const { user } = useAuth();
  const { toast } = useToast();

  const logActivity = async (activity: ActivityLog) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_activities')
        .insert({
          user_id: user.id,
          ...activity,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to log activity:', error);
      toast({
        title: "Logging Error",
        description: "Failed to save your activity. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getActivities = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', user.id)
        .order('occurred_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      return [];
    }
  };

  return {
    logActivity,
    getActivities,
  };
}