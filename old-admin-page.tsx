"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminNavbar } from "@/components/admin-navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserDetailsModal } from "@/components/user-details-modal";
import { t } from "@/lib/i18n";
import { Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/language-context";

export default function AdminDashboard() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { toast } = useToast();

  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);



  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const response = await fetch("/api/admin/users/pending");
      if (response.ok) {
        const data = await response.json();
        setPendingUsers(data);
      } else if (response.status === 401) {
        router.push("/");
      }
    } catch (error) {
      console.error("[v0] Error fetching pending users:", error);
      toast({
        title: t("error", lang),
        description:
          lang === "es"
            ? "No se pudieron cargar los usuarios"
            : "Could not load users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleApprove = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: "POST",
      });
      const body = await response.json();

      if (response.ok && body.success) {
        toast({
          title: lang === "es" ? "Usuario aprobado" : "User approved",
          description: body.message,
        });
        setIsModalOpen(false);
        fetchPendingUsers();
      } else {
        throw new Error(body?.error || "Failed to approve user");
      }
    } catch (error: any) {
      console.error("[v0] Error approving user:", error);
      toast({
        title: t("error", lang),
        description:
          lang === "es"
            ? "No se pudo aprobar el usuario"
            : "Could not approve user",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/reject`, {
        method: "POST",
        body: JSON.stringify({ notes: "Optional notes" }),
        headers: { "Content-Type": "application/json" },
      });
      const body = await response.json();

      if (response.ok && body.success) {
        toast({
          title: lang === "es" ? "Usuario rechazado" : "User rejected",
          description: body.message,
        });
        setIsModalOpen(false);
        fetchPendingUsers();
      } else {
        throw new Error(body?.error || "Failed to reject user");
      }
    } catch (error: any) {
      console.error("[v0] Error rejecting user:", error);
      toast({
        title: t("error", lang),
        description:
          lang === "es"
            ? "No se pudo rechazar el usuario"
            : "Could not reject user",
        variant: "destructive",
      });
    }
  };
  const handleRequestDocs = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/request-docs`, {
        method: "POST",
      });
      const body = await response.json();

      if (response.ok) {
        toast({
          title: "Email sent",
          description: `The document request email has been sent to ${body.contact.email}`,
        });
        setIsModalOpen(false);
        fetchPendingUsers();
      } else {
        throw new Error(body?.error || "Failed to request documents");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Could not request documents",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-600";
      case "documents_requested":
        return "bg-blue-500/10 text-blue-600";
      case "approved":
        return "bg-green-500/10 text-green-600";
      case "rejected":
        return "bg-red-500/10 text-red-600";
      default:
        return "bg-gray-500/10 text-gray-600";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <AdminNavbar />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-96" />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <AdminNavbar />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {t("admin.title", lang)}
              </CardTitle>
              <p className="text-muted-foreground">
                {t("admin.pending_users", lang)}
              </p>
            </CardHeader>
            <CardContent>
              {pendingUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {t("admin.no_pending", lang)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("admin.business_name", lang)}</TableHead>
                        <TableHead>{t("admin.email", lang)}</TableHead>
                        <TableHead>{t("admin.phone", lang)}</TableHead>
                        <TableHead>{t("admin.status", lang)}</TableHead>
                        <TableHead className="text-right">
                          {t("admin.actions", lang)}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.business_name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.phone}</TableCell>
                          <TableCell>
                            <Badge
                              className={getStatusColor(user.approval_status)}
                            >
                              {t(
                                `dashboard.status.${user.approval_status}`,
                                lang
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(user)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {t("admin.view_details", lang)}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <UserDetailsModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestDocs={handleRequestDocs}
        lang={lang}
      />
    </div>
  );
}
