import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Save, Plus, Trash2, Edit, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";

interface Product {
  id: string;
  name: string;
  category: string;
  description: string | null;
  balance_label: string | null;
  price_label: string | null;
  price: number;
  active: boolean | null;
  created_at: string | null;
}

interface ProductFormData {
  name: string;
  category: string;
  description: string;
  balance_label: string;
  price_label: string;
  price: string;
  active: boolean;
}

const CATEGORIES = ["Banks", "Cards", "Accounts", "Tools"];

const initialFormData: ProductFormData = {
  name: "",
  category: "",
  description: "",
  balance_label: "",
  price_label: "",
  price: "",
  active: true,
};

export const AdminProducts = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel("public:products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("category")
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingProduct(null);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return false;
    }
    if (!formData.category) {
      toast.error("Category is required");
      return false;
    }
    if (!formData.price || parseFloat(formData.price) < 0) {
      toast.error("Valid price is required");
      return false;
    }
    return true;
  };

  const addNewProduct = async () => {
    if (!validateForm()) return;

    try {
      const { error } = await supabase.from("products").insert({
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim() || null,
        balance_label: formData.balance_label.trim() || null,
        price_label: formData.price_label.trim() || null,
        price: parseFloat(formData.price),
        active: formData.active,
      });

      if (error) throw error;

      await supabase.from("admin_actions_log").insert({
        admin_id: user?.id,
        action_type: "add_product",
        affected_table: "products",
        note: `Added product: ${formData.name}`,
      });

      toast.success("Product added successfully");
      resetForm();
      setIsAddDialogOpen(false);
      await fetchProducts();
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      description: product.description || "",
      balance_label: product.balance_label || "",
      price_label: product.price_label || "",
      price: product.price.toString(),
      active: product.active ?? true,
    });
    setIsEditDialogOpen(true);
  };

  const updateProduct = async () => {
    if (!validateForm() || !editingProduct) return;

    try {
      const { error } = await supabase
        .from("products")
        .update({
          name: formData.name.trim(),
          category: formData.category,
          description: formData.description.trim() || null,
          balance_label: formData.balance_label.trim() || null,
          price_label: formData.price_label.trim() || null,
          price: parseFloat(formData.price),
          active: formData.active,
        })
        .eq("id", editingProduct.id);

      if (error) throw error;

      await supabase.from("admin_actions_log").insert({
        admin_id: user?.id,
        action_type: "edit_product",
        affected_table: "products",
        affected_id: editingProduct.id,
        note: `Updated product: ${formData.name}`,
      });

      toast.success("Product updated successfully");
      resetForm();
      setIsEditDialogOpen(false);
      await fetchProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    }
  };

  const deleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (error) throw error;

      await supabase.from("admin_actions_log").insert({
        admin_id: user?.id,
        action_type: "delete_product",
        affected_table: "products",
        affected_id: product.id,
        note: `Deleted product: ${product.name}`,
      });

      toast.success("Product deleted successfully");
      await fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const toggleProductStatus = async (product: Product) => {
    try {
      const newStatus = !product.active;
      const { error } = await supabase
        .from("products")
        .update({ active: newStatus })
        .eq("id", product.id);

      if (error) throw error;

      await supabase.from("admin_actions_log").insert({
        admin_id: user?.id,
        action_type: "toggle_product_status",
        affected_table: "products",
        affected_id: product.id,
        note: `${newStatus ? "Activated" : "Deactivated"} product: ${product.name}`,
      });

      toast.success(`Product ${newStatus ? "activated" : "deactivated"}`);
      await fetchProducts();
    } catch (error) {
      console.error("Error toggling product status:", error);
      toast.error("Failed to update product status");
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const ProductFormFields = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          placeholder="Enter product name"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter product description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="balance_label">Balance Label</Label>
          <Input
            id="balance_label"
            placeholder="e.g., $75,000"
            value={formData.balance_label}
            onChange={(e) => handleInputChange("balance_label", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price_label">Price Label</Label>
          <Input
            id="price_label"
            placeholder="e.g., $300"
            value={formData.price_label}
            onChange={(e) => handleInputChange("price_label", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Price (USD) *</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          min="0"
          placeholder="Enter price"
          value={formData.price}
          onChange={(e) => handleInputChange("price", e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
        <div className="space-y-0.5">
          <Label htmlFor="active">Active Status</Label>
          <p className="text-xs text-muted-foreground">
            {formData.active ? "Product is visible to users" : "Product is hidden from users"}
          </p>
        </div>
        <Switch
          id="active"
          checked={formData.active}
          onCheckedChange={(checked) => handleInputChange("active", checked)}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card className="glass-card border-border/50 p-8">
        <div className="text-center text-muted-foreground">Loading products...</div>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6 p-4 glass-card border border-border/50 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Products Management</h2>
            <p className="text-sm text-muted-foreground">Create, edit, and manage products across all categories</p>
          </div>
          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="gradient-primary text-black font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl bg-background/95 backdrop-blur-xl border-border/40 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Add New Product</DialogTitle>
              </DialogHeader>
              <ProductFormFields />
              <Button onClick={addNewProduct} className="w-full gradient-primary text-black font-semibold">
                Add Product
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-2xl bg-background/95 backdrop-blur-xl border-border/40 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit Product</DialogTitle>
          </DialogHeader>
          <ProductFormFields />
          <Button onClick={updateProduct} className="w-full gradient-primary text-black font-semibold">
            Update Product
          </Button>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card
            key={product.id}
            className={`glass-card border-border/50 rounded-lg shadow-card hover:shadow-glow transition-all duration-300 ${
              !product.active ? "opacity-60" : ""
            }`}
          >
            <CardHeader className="border-b border-border/50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-neon-blue" />
                  <span className="text-lg font-semibold text-foreground">{product.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      product.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {product.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <span className="text-xs font-semibold text-neon-blue uppercase tracking-wider">{product.category}</span>
                {product.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{product.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                {product.balance_label && (
                  <div>
                    <span className="text-muted-foreground">Balance:</span>
                    <p className="font-semibold text-foreground">{product.balance_label}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Price:</span>
                  <p className="font-semibold text-neon-blue">${product.price}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <Button
                  onClick={() => openEditDialog(product)}
                  size="sm"
                  className="bg-gradient-to-r from-neon-blue to-neon-pink text-white font-semibold hover:opacity-90 transition-all"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => toggleProductStatus(product)}
                  size="sm"
                  variant={product.active ? "outline" : "default"}
                  className="font-semibold"
                >
                  {product.active ? "Hide" : "Show"}
                </Button>
                <Button onClick={() => deleteProduct(product)} size="sm" variant="destructive" className="font-semibold">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card className="glass-card border-border/50 p-8">
          <div className="text-center text-muted-foreground">
            {searchQuery || categoryFilter !== "all" ? "No products match your filters" : "No products yet. Add your first product!"}
          </div>
        </Card>
      )}
    </div>
  );
};
