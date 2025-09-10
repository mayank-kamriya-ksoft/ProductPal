import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sprout, LogOut, Clock, CheckCircle, XCircle, List, Eye, Check, X } from "lucide-react";
import { Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ProductCard from "@/components/product-card";

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  if (user?.role !== "admin") {
    setLocation("/");
    return null;
  }

  const { data: pendingProducts = [], isLoading: pendingLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", "pending"],
    queryFn: () => fetch("/api/products?status=pending").then(res => res.json()),
  });

  const { data: approvedProducts = [], isLoading: approvedLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", "approved"],
    queryFn: () => fetch("/api/products?status=approved").then(res => res.json()),
  });

  const { data: rejectedProducts = [], isLoading: rejectedLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", "rejected"],
    queryFn: () => fetch("/api/products?status=rejected").then(res => res.json()),
  });

  const { data: allProducts = [], isLoading: allLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: () => fetch("/api/products").then(res => res.json()),
  });

  const approveProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await apiRequest("PATCH", `/api/products/${productId}/status`, {
        status: "approved",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product approved",
        description: "The product has been successfully approved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectProductMutation = useMutation({
    mutationFn: async ({ productId, reason }: { productId: string; reason: string }) => {
      const res = await apiRequest("PATCH", `/api/products/${productId}/status`, {
        status: "rejected",
        rejectionReason: reason,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setShowRejectDialog(false);
      setRejectionReason("");
      toast({
        title: "Product rejected",
        description: "The product has been rejected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Rejection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setLocation("/auth");
      },
    });
  };

  const handleApprove = (productId: string) => {
    approveProductMutation.mutate(productId);
  };

  const handleReject = (product: Product) => {
    setSelectedProduct(product);
    setShowRejectDialog(true);
  };

  const confirmReject = () => {
    if (selectedProduct && rejectionReason.trim()) {
      rejectProductMutation.mutate({
        productId: selectedProduct.id,
        reason: rejectionReason,
      });
    }
  };

  const handleViewPublicPage = (uniqueId: string) => {
    window.open(`/track/${uniqueId}`, "_blank");
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getProductsForTab = (tab: string) => {
    switch (tab) {
      case "pending":
        return pendingProducts;
      case "approved":
        return approvedProducts;
      case "rejected":
        return rejectedProducts;
      case "all":
        return allProducts;
      default:
        return [];
    }
  };

  const getLoadingForTab = (tab: string) => {
    switch (tab) {
      case "pending":
        return pendingLoading;
      case "approved":
        return approvedLoading;
      case "rejected":
        return rejectedLoading;
      case "all":
        return allLoading;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="bg-card border-b border-border px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
              <Sprout className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Green Gold Seeds - Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Product Management & Approval</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, <span className="font-medium">{user?.username}</span>
            </span>
            <Button 
              onClick={handleLogout} 
              variant="outline"
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending" className="flex items-center gap-2" data-testid="tab-pending">
              <Clock className="h-4 w-4" />
              Pending
              {pendingProducts.length > 0 && (
                <Badge variant="secondary" className="ml-1 bg-secondary text-secondary-foreground">
                  {pendingProducts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2" data-testid="tab-approved">
              <CheckCircle className="h-4 w-4" />
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2" data-testid="tab-rejected">
              <XCircle className="h-4 w-4" />
              Rejected
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2" data-testid="tab-all">
              <List className="h-4 w-4" />
              All Products
            </TabsTrigger>
          </TabsList>

          {["pending", "approved", "rejected", "all"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-foreground capitalize">
                    {tab === "all" ? "All Products" : `${tab} Products`}
                  </h2>
                </div>

                {getLoadingForTab(tab) ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading products...</p>
                  </div>
                ) : getProductsForTab(tab).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No {tab === "all" ? "" : tab} products found.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {getProductsForTab(tab).map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onApprove={tab === "pending" ? () => handleApprove(product.id) : undefined}
                        onReject={tab === "pending" ? () => handleReject(product) : undefined}
                        onViewPublic={product.status === "approved" ? () => handleViewPublicPage(product.uniqueId) : undefined}
                        isLoading={approveProductMutation.isPending || rejectProductMutation.isPending}
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent data-testid="dialog-reject">
          <DialogHeader>
            <DialogTitle>Reject Product</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this product. This will be sent to the operator.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1"
                data-testid="textarea-rejection-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowRejectDialog(false)}
              data-testid="button-cancel-reject"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmReject}
              disabled={!rejectionReason.trim() || rejectProductMutation.isPending}
              data-testid="button-confirm-reject"
            >
              {rejectProductMutation.isPending ? "Rejecting..." : "Reject Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
