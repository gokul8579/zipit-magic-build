import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Mail, Calendar, Shield } from "lucide-react";

const Profile = () => {
  const [profile, setProfile] = useState<{
    email: string;
    created_at: string;
    role: string;
  } | null>(null);
  const [companySettings, setCompanySettings] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [roleData, companyData] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", user.id).single(),
      supabase.from("company_settings").select("*").eq("user_id", user.id).single(),
    ]);

    setProfile({
      email: user.email || "",
      created_at: user.created_at,
      role: roleData.data?.role || "sales_rep",
    });
    
    setCompanySettings(companyData.data);
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Your account information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <UserCircle className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{profile.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge variant="outline" className="capitalize">
                {profile.role.replace("_", " ")}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="font-medium">
                {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {companySettings && (
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Company Name</p>
                <p className="font-medium">{companySettings.company_name}</p>
              </div>
            </div>
            {companySettings.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Company Email</p>
                  <p className="font-medium">{companySettings.email}</p>
                </div>
              </div>
            )}
            {companySettings.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{companySettings.phone}</p>
              </div>
            )}
            {companySettings.address && (
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{companySettings.address}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Profile;