'use client';

import { useEffect, useState } from 'react';
import { Tag, Save, Plus, Edit, Trash2 } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, toast, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@pg-prepaid/ui';
import { DashboardLayout } from '@/components/dashboard-layout';
import { cn } from '@/lib/utils';

interface Discount {
  _id: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  applicableCountries?: string[];
  usageLimit?: number;
  usageCount: number;
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    isActive: true,
    startDate: '',
    endDate: '',
    minPurchaseAmount: '',
    maxDiscountAmount: '',
    usageLimit: '',
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/discounts');
      if (response.ok) {
        const data = await response.json();
        setDiscounts(data.discounts);
      }
    } catch (error) {
      console.error('Failed to fetch discounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load discounts',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'percentage',
      value: 0,
      isActive: true,
      startDate: '',
      endDate: '',
      minPurchaseAmount: '',
      maxDiscountAmount: '',
      usageLimit: '',
    });
    setEditingDiscount(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (discount: Discount) => {
    setEditingDiscount(discount);
    setFormData({
      name: discount.name,
      description: discount.description,
      type: discount.type,
      value: discount.value,
      isActive: discount.isActive,
      startDate: discount.startDate ? new Date(discount.startDate).toISOString().split('T')[0] : '',
      endDate: discount.endDate ? new Date(discount.endDate).toISOString().split('T')[0] : '',
      minPurchaseAmount: discount.minPurchaseAmount?.toString() || '',
      maxDiscountAmount: discount.maxDiscountAmount?.toString() || '',
      usageLimit: discount.usageLimit?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Discount name is required',
        variant: 'error',
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: 'Error',
        description: 'Discount description is required',
        variant: 'error',
      });
      return;
    }

    if (formData.value <= 0) {
      toast({
        title: 'Error',
        description: 'Discount value must be greater than 0',
        variant: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        value: formData.value,
        isActive: formData.isActive,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        minPurchaseAmount: formData.minPurchaseAmount ? parseFloat(formData.minPurchaseAmount) : null,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
      };

      const url = editingDiscount
        ? `/api/v1/discounts/${editingDiscount._id}`
        : '/api/v1/discounts';

      const method = editingDiscount ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Discount ${editingDiscount ? 'updated' : 'created'} successfully!`,
          variant: 'success',
        });
        setIsDialogOpen(false);
        resetForm();
        fetchDiscounts();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to save discount',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Failed to save discount:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/discounts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Discount deleted successfully!',
          variant: 'success',
        });
        fetchDiscounts();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete discount',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Failed to delete discount:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'error',
      });
    }
  };

  const toggleDiscountStatus = async (discount: Discount) => {
    try {
      const response = await fetch(`/api/v1/discounts/${discount._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !discount.isActive }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Discount ${!discount.isActive ? 'activated' : 'deactivated'}`,
          variant: 'success',
        });
        fetchDiscounts();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update discount status',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Failed to toggle discount:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'error',
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading discounts...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Discounts</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage promotional discounts for your storefront
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create Discount
          </Button>
        </div>

        {/* Discounts List */}
        {discounts.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground font-medium">No discounts created yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your first discount to start offering promotions
                </p>
                <Button onClick={openCreateDialog} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Discount
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {discounts.map((discount) => (
              <Card key={discount._id} className={cn(!discount.isActive && 'opacity-60')}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle>{discount.name}</CardTitle>
                        {discount.isActive ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <CardDescription className="mt-1">{discount.description}</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(discount)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(discount._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Discount Value */}
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <span className="text-sm font-medium">Discount:</span>
                    <span className="text-lg font-bold text-primary">
                      {discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`} off
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    {discount.minPurchaseAmount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Min Purchase:</span>
                        <span className="font-medium">${discount.minPurchaseAmount}</span>
                      </div>
                    )}
                    {discount.maxDiscountAmount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Discount:</span>
                        <span className="font-medium">${discount.maxDiscountAmount}</span>
                      </div>
                    )}
                    {discount.usageLimit && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Usage:</span>
                        <span className="font-medium">
                          {discount.usageCount} / {discount.usageLimit}
                        </span>
                      </div>
                    )}
                    {(discount.startDate || discount.endDate) && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valid:</span>
                        <span className="font-medium">
                          {discount.startDate && new Date(discount.startDate).toLocaleDateString()}
                          {discount.startDate && discount.endDate && ' - '}
                          {discount.endDate && new Date(discount.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    <Button
                      variant={discount.isActive ? 'outline' : 'default'}
                      size="sm"
                      className="w-full"
                      onClick={() => toggleDiscountStatus(discount)}
                    >
                      {discount.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingDiscount ? 'Edit Discount' : 'Create New Discount'}
              </DialogTitle>
              <DialogDescription>
                {editingDiscount
                  ? 'Update the discount details below'
                  : 'Fill in the details to create a new discount'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Discount Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Summer Sale"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Get 10% off all top-ups!"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Discount Type</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'percentage' | 'fixed' })}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Discount Value</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="10"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Start Date (optional)</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">End Date (optional)</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Min Purchase Amount (optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="25.00"
                    value={formData.minPurchaseAmount}
                    onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Max Discount Amount (optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="50.00"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Usage Limit (optional)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Leave empty for unlimited"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  className="h-4 w-4"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  Activate discount immediately
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : editingDiscount ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
