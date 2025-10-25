import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, FileText, Download, Trash2, Eye } from "lucide-react";

interface Paper {
  id: string;
  name: string;
  file_path: string;
  file_type: string;
  created_at: string;
}

const Papers = () => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingFile, setViewingFile] = useState<{ url: string; type: string; name: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    file: null as File | null,
  });

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("papers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPapers(data || []);
    } catch (error: any) {
      toast.error("Error fetching documents");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Upload file to storage
      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("papers")
        .upload(fileName, formData.file);

      if (uploadError) throw uploadError;

      // Save record to database
      const { error: dbError } = await supabase.from("papers").insert({
        name: formData.name,
        file_path: fileName,
        file_type: formData.file.type,
        user_id: user.id,
      });

      if (dbError) throw dbError;

      toast.success("Document uploaded successfully!");
      setOpen(false);
      setFormData({ name: "", file: null });
      fetchPapers();
    } catch (error: any) {
      toast.error("Error uploading document");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (paper: Paper) => {
    try {
      const { data, error } = await supabase.storage
        .from("papers")
        .download(paper.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = paper.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error("Error downloading document");
    }
  };

  const handleView = async (paper: Paper) => {
    try {
      const { data, error } = await supabase.storage
        .from("papers")
        .download(paper.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      setViewingFile({ url, type: paper.file_type, name: paper.name });
      setViewerOpen(true);
    } catch (error: any) {
      toast.error("Error loading document");
    }
  };

  const handleDelete = async (paper: Paper) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const { error: storageError } = await supabase.storage
        .from("papers")
        .remove([paper.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("papers")
        .delete()
        .eq("id", paper.id);

      if (dbError) throw dbError;

      toast.success("Document deleted successfully!");
      fetchPapers();
    } catch (error: any) {
      toast.error("Error deleting document");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Papers & Documents</h1>
          <p className="text-muted-foreground">Upload and manage important documents</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Document</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Document Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">File (PDF, JPG, PNG) *</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={uploading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : papers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-12 w-12 text-muted-foreground/50" />
                    <p>No documents yet</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              papers.map((paper) => (
                <TableRow key={paper.id}>
                  <TableCell className="font-medium">{paper.name}</TableCell>
                  <TableCell>{paper.file_type}</TableCell>
                  <TableCell>{new Date(paper.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(paper);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(paper);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(paper);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* File Viewer Dialog */}
      <Dialog open={viewerOpen} onOpenChange={(open) => {
        setViewerOpen(open);
        if (!open && viewingFile) {
          URL.revokeObjectURL(viewingFile.url);
          setViewingFile(null);
        }
      }}>
        <DialogContent className="max-w-5xl h-[85vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>{viewingFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="h-[75vh] overflow-hidden px-6 pb-6">
            {viewingFile?.type.includes('pdf') ? (
              <iframe
                src={viewingFile.url}
                className="w-full h-full border-0"
                title={viewingFile.name}
              />
            ) : viewingFile?.type.includes('image') ? (
              <img
                src={viewingFile.url}
                alt={viewingFile.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Preview not available for this file type</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Papers;
