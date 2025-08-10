import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Trash2, RefreshCw, Database, Clock, HardDrive, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface BackupFile {
  filename: string;
  size: number;
  created: string;
  sizeMB: number;
}

interface BackupStats {
  success: boolean;
  count: number;
  totalSize: number;
  totalSizeMB: number;
  files: BackupFile[];
}

interface BackupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BackupModal({ open, onOpenChange }: BackupModalProps) {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch backup statistics
  const { data: backupStats, isLoading, refetch } = useQuery<BackupStats>({
    queryKey: ['/api/backup/stats'],
    enabled: open,
    refetchInterval: 10000 // Refresh every 10 seconds when modal is open
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: () => apiRequest('/api/backup/create', { method: 'POST' }),
    onMutate: () => {
      setIsCreatingBackup(true);
      toast({
        title: "Creating Backup",
        description: "Please wait while we create your database backup...",
      });
    },
    onSuccess: (data: any) => {
      setIsCreatingBackup(false);
      toast({
        title: "Backup Created Successfully",
        description: `Backup file: ${data.filename} (${data.sizeMB} MB)`,
      });
      refetch();
    },
    onError: (error: any) => {
      setIsCreatingBackup(false);
      toast({
        title: "Backup Failed",
        description: error.message || "Failed to create backup",
        variant: "destructive",
      });
    }
  });

  // Delete backup mutation
  const deleteBackupMutation = useMutation({
    mutationFn: (filename: string) => 
      apiRequest(`/api/backup/delete/${filename}`, { method: 'DELETE' }),
    onSuccess: (data: any) => {
      toast({
        title: "Backup Deleted",
        description: data.message,
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete backup",
        variant: "destructive",
      });
    }
  });

  const handleDownload = (filename: string) => {
    const downloadUrl = `/api/backup/download/${filename}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: `Downloading ${filename}`,
    });
  };

  const handleDelete = (filename: string) => {
    if (window.confirm(`Are you sure you want to delete backup: ${filename}?`)) {
      deleteBackupMutation.mutate(filename);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Backup Management
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-6">
          {/* Backup Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : backupStats?.count || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Size</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : `${backupStats?.totalSizeMB || 0} MB`}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Latest Backup</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {isLoading ? "..." : 
                    backupStats?.files?.[0] ? 
                      formatDate(backupStats.files[0].created) : 
                      "No backups"
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={() => createBackupMutation.mutate()}
              disabled={isCreatingBackup}
              className="flex items-center gap-2"
            >
              {isCreatingBackup ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {isCreatingBackup ? "Creating Backup..." : "Create Backup Now"}
            </Button>

            <Button 
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Backup Files List */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-lg">Available Backups</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Loading backups...
                </div>
              ) : !backupStats?.files?.length ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No backups found</p>
                  <p className="text-sm">Create your first backup to get started</p>
                </div>
              ) : (
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {backupStats.files.map((backup) => (
                      <div 
                        key={backup.filename}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {backup.filename}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {backup.sizeMB} MB
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Created: {formatDate(backup.created)}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(backup.filename)}
                            className="flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(backup.filename)}
                            disabled={deleteBackupMutation.isPending}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Restore Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Restore Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                To restore a backup, download the file and use the command line tool:
              </p>
              <code className="block text-xs bg-muted p-2 rounded">
                node scripts/backup-restore.cjs
              </code>
              <p className="text-xs text-muted-foreground">
                ⚠️ Restoring will replace all current data. Make sure to create a backup before restoring.
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}