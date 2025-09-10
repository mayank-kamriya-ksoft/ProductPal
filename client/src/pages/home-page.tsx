import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sprout, LogOut, Plus, List, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import ProductForm from "@/components/product-form";
import { Product } from "@shared/schema";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  const { data: products = [], isLoading, refetch } = useQuery<Product[]>({
    queryKey: ["/api/products", user?.id],
    enabled: !!user?.id,
  });

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setLocation("/auth");
      },
    });
  };

  if (user?.role === "admin") {
    setLocation("/admin");
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-IN');
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
              <h1 className="text-lg font-semibold text-foreground">Green Gold Seeds</h1>
              <p className="text-sm text-muted-foreground">Product Tracking System</p>
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
      <div className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="submit" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="submit" className="flex items-center gap-2" data-testid="tab-submit">
              <Plus className="h-4 w-4" />
              Submit Product
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2" data-testid="tab-products">
              <List className="h-4 w-4" />
              My Products ({products.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="submit" className="space-y-4">
            <ProductForm onSuccess={() => refetch()} />
          </TabsContent>
          
          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">My Submitted Products</h2>
              <Button onClick={() => refetch()} variant="outline" size="sm" data-testid="button-refresh">
                Refresh
              </Button>
            </div>
            
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <List className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Products Submitted</h3>
                  <p className="text-muted-foreground mb-4">You haven't submitted any products yet.</p>
                  <Button variant="outline" onClick={() => setLocation("?tab=submit")} data-testid="button-submit-first">
                    Submit Your First Product
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <Card key={product.id} className="hover:shadow-md transition-shadow" data-testid={`card-product-${product.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-semibold text-foreground line-clamp-2">
                          {product.product}
                        </CardTitle>
                        <Badge 
                          className={`${getStatusColor(product.status)} text-white text-xs`}
                          data-testid={`status-${product.status}`}
                        >
                          {product.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{product.brand}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Unique ID:</span> {product.uniqueId}</p>
                        <p><span className="font-medium">MRP:</span> ₹{product.mrp}</p>
                        <p><span className="font-medium">Net Qty:</span> {product.netQty}</p>
                        <p><span className="font-medium">Batch:</span> {product.lotBatch}</p>
                        <p><span className="font-medium">Submitted:</span> {product.submissionDate ? formatDate(product.submissionDate) : 'N/A'}</p>
                        {product.status === "approved" && product.approvalDate && (
                          <p><span className="font-medium">Approved:</span> {formatDate(product.approvalDate)}</p>
                        )}
                        {product.status === "rejected" && product.rejectionReason && (
                          <p className="text-red-600"><span className="font-medium">Reason:</span> {product.rejectionReason}</p>
                        )}
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        {product.status === "approved" && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => window.open(`/track/${product.uniqueId}`, '_blank')}
                            className="flex-1"
                            data-testid={`button-view-${product.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Public
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
