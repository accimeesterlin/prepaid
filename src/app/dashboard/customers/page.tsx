'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  User,
  Phone,
  MapPin,
  Edit2,
  MoreVertical,
  Star,
  StarOff,
  Users,
  Grid3x3,
  List,
  Link2,
  Folder,
  X,
} from 'lucide-react';

import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge,
  toast,
} from '@pg-prepaid/ui';
import { DashboardLayout } from '@/components/dashboard-layout';

interface Customer {
  _id: string;
  phoneNumber: string;
  email?: string;
  name?: string;
  country?: string;
  isFavorite: boolean;
  groups: string[];
  metadata: {
    totalPurchases: number;
    totalSpent: number;
    currency: string;
  };
  createdAt: string;
}

interface CustomerGroup {
  _id: string;
  name: string;
  description?: string;
  color: string;
  customerCount: number;
}

type ViewMode = 'grid' | 'list';

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showAddToGroupModal, setShowAddToGroupModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [orgSlug, setOrgSlug] = useState<string>('');

  const [formData, setFormData] = useState({
    phoneNumber: '',
    email: '',
    name: '',
    country: '',
  });

  const [editFormData, setEditFormData] = useState({
    phoneNumber: '',
    email: '',
    name: '',
    country: '',
  });

  const [groupFormData, setGroupFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editMessage, setEditMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [groupMessage, setGroupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchOrgSlug();
    fetchGroups();
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [search, selectedFilter, selectedGroup]);

  const fetchOrgSlug = async () => {
    try {
      const response = await fetch('/api/v1/organizations');
      if (response.ok) {
        const data = await response.json();
        const currentOrg = data.organizations?.find((org: any) => org.isCurrent);
        if (currentOrg) {
          setOrgSlug(currentOrg.slug);
        }
      }
    } catch (error) {
      console.error('Failed to fetch organization slug:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/v1/customer-groups');
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      let url = '/api/v1/customers';
      const params = new URLSearchParams();

      if (search) params.append('search', search);
      if (selectedFilter === 'favorites') params.append('favorites', 'true');
      if (selectedGroup) params.append('groupId', selectedGroup);

      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/v1/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Customer created successfully!',
          variant: 'success',
        });
        await fetchCustomers();
        setShowCreateModal(false);
        setFormData({ phoneNumber: '', email: '', name: '', country: '' });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to create customer',
          variant: 'error',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create customer',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditFormData({
      phoneNumber: customer.phoneNumber,
      email: customer.email || '',
      name: customer.name || '',
      country: customer.country || '',
    });
    setEditMessage(null);
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingCustomer) return;

    setSaving(true);
    setEditMessage(null);

    try {
      const response = await fetch(`/api/v1/customers/${editingCustomer._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Customer updated successfully!',
          variant: 'success',
        });
        await fetchCustomers();
        setShowEditModal(false);
        setEditingCustomer(null);
        setEditFormData({ phoneNumber: '', email: '', name: '', country: '' });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update customer',
          variant: 'error',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update customer',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleFavorite = async (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const response = await fetch(`/api/v1/customers/${customer._id}/favorite`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchCustomers();
        toast({
          title: 'Success',
          description: customer.isFavorite ? 'Removed from favorites' : 'Added to favorites',
          variant: 'success',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle favorite',
        variant: 'error',
      });
    }
  };

  const copyPortalLink = (customer: Customer) => {
    const portalUrl = `${window.location.origin}/customer-portal/${orgSlug}/login?email=${encodeURIComponent(customer.email || '')}`;
    navigator.clipboard.writeText(portalUrl);
    toast({
      title: 'Success',
      description: 'Customer portal link copied to clipboard',
      variant: 'success',
    });
  };

  const handleCreateGroup = async () => {
    setSaving(true);
    setGroupMessage(null);

    try {
      const response = await fetch('/api/v1/customer-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupFormData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Group created successfully!',
          variant: 'success',
        });
        await fetchGroups();
        setShowGroupModal(false);
        setGroupFormData({ name: '', description: '', color: '#3b82f6' });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to create group',
          variant: 'error',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create group',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const addToGroup = async (groupId: string) => {
    if (!selectedCustomer) return;

    try {
      const response = await fetch(`/api/v1/customers/${selectedCustomer._id}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Customer added to group',
          variant: 'success',
        });
        await fetchCustomers();
        await fetchGroups();
        setShowAddToGroupModal(false);
        setSelectedCustomer(null);
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to add to group',
          variant: 'error',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add to group',
        variant: 'error',
      });
    }
  };

  const removeFromGroup = async (customerId: string, groupId: string) => {
    try {
      const response = await fetch(`/api/v1/customers/${customerId}/groups?groupId=${groupId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Customer removed from group',
          variant: 'success',
        });
        await fetchCustomers();
        await fetchGroups();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to remove from group',
          variant: 'error',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove from group',
        variant: 'error',
      });
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? Customers will not be deleted.')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/customer-groups/${groupId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Group deleted successfully',
          variant: 'success',
        });
        await fetchGroups();
        await fetchCustomers();
        if (selectedGroup === groupId) {
          setSelectedGroup('');
        }
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to delete group',
          variant: 'error',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete group',
        variant: 'error',
      });
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading customers...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const CustomerCard = ({ customer }: { customer: Customer }) => (
    <Card
      className="hover:border-primary transition-colors cursor-pointer"
      onClick={() => router.push(`/dashboard/customers/${customer._id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{customer.name || 'Unnamed Customer'}</h3>
                {customer.isFavorite && <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-primary/10">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => toggleFavorite(customer, e as any)}>
                    {customer.isFavorite ? (
                      <>
                        <StarOff className="h-4 w-4 mr-2" />
                        Remove from Favorites
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4 mr-2" />
                        Add to Favorites
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCustomer(customer);
                      setShowAddToGroupModal(true);
                    }}
                  >
                    <Folder className="h-4 w-4 mr-2" />
                    Add to Group
                  </DropdownMenuItem>
                  {customer.email && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        copyPortalLink(customer);
                      }}
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Copy Portal Link
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(customer);
                    }}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Customer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-0.5 mt-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{customer.phoneNumber}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
              {customer.country && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{customer.country}</span>
                </div>
              )}
            </div>
            {customer.groups.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {customer.groups.map((groupId) => {
                  const group = groups.find((g) => g._id === groupId);
                  if (!group) return null;
                  return (
                    <Badge
                      key={groupId}
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: group.color, color: group.color }}
                    >
                      {group.name}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromGroup(customer._id, groupId);
                        }}
                        className="ml-1 hover:bg-destructive/20 rounded-full"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
            <div className="mt-2 pt-2 border-t flex justify-between text-xs">
              <span className="text-muted-foreground">{customer.metadata.totalPurchases} purchases</span>
              <span className="font-semibold">{formatCurrency(customer.metadata.totalSpent, customer.metadata.currency)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const CustomerListItem = ({ customer }: { customer: Customer }) => (
    <Card
      className="hover:border-primary transition-colors cursor-pointer"
      onClick={() => router.push(`/dashboard/customers/${customer._id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{customer.name || 'Unnamed Customer'}</h3>
                  {customer.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                </div>
                <p className="text-sm text-muted-foreground">{customer.phoneNumber}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground truncate">{customer.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Purchases</p>
              <p className="text-sm text-muted-foreground">
                {customer.metadata.totalPurchases} ({formatCurrency(customer.metadata.totalSpent, customer.metadata.currency)})
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              {customer.groups.slice(0, 2).map((groupId) => {
                const group = groups.find((g) => g._id === groupId);
                if (!group) return null;
                return (
                  <Badge key={groupId} variant="outline" style={{ borderColor: group.color, color: group.color }}>
                    {group.name}
                  </Badge>
                );
              })}
              {customer.groups.length > 2 && <Badge variant="outline">+{customer.groups.length - 2}</Badge>}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => toggleFavorite(customer, e as any)}>
                    {customer.isFavorite ? (
                      <>
                        <StarOff className="h-4 w-4 mr-2" />
                        Remove from Favorites
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4 mr-2" />
                        Add to Favorites
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCustomer(customer);
                      setShowAddToGroupModal(true);
                    }}
                  >
                    <Folder className="h-4 w-4 mr-2" />
                    Add to Group
                  </DropdownMenuItem>
                  {customer.email && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        copyPortalLink(customer);
                      }}
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Copy Portal Link
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(customer);
                    }}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Customer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground mt-1">Manage your customer database and relationships</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowGroupModal(true)}>
              <Users className="h-4 w-4 mr-2" />
              Manage Groups
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </div>

        {/* Filters and View Toggle */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by phone, email, or name..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedFilter('all');
                setSelectedGroup('');
              }}
            >
              All Customers
            </Button>
            <Button
              variant={selectedFilter === 'favorites' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedFilter('favorites');
                setSelectedGroup('');
              }}
            >
              <Star className="h-4 w-4 mr-1" />
              Favorites
            </Button>
            {groups.map((group) => (
              <Button
                key={group._id}
                variant={selectedGroup === group._id ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedFilter('group');
                  setSelectedGroup(group._id);
                }}
                style={
                  selectedGroup === group._id
                    ? { backgroundColor: group.color, borderColor: group.color }
                    : { borderColor: group.color, color: group.color }
                }
              >
                <Users className="h-4 w-4 mr-1" />
                {group.name} ({group.customerCount})
              </Button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Customers Display */}
        {customers.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{customers.map((customer) => <CustomerCard key={customer._id} customer={customer} />)}</div>
          ) : (
            <div className="space-y-2">{customers.map((customer) => <CustomerListItem key={customer._id} customer={customer} />)}</div>
          )
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No customers found</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                {selectedFilter === 'favorites'
                  ? 'You haven\'t marked any customers as favorites yet.'
                  : selectedGroup
                    ? 'No customers in this group yet.'
                    : search
                      ? 'No customers match your search criteria.'
                      : 'Customer records will be created automatically when they make their first purchase, or you can add them manually.'}
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Customer Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>Create a new customer record</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  placeholder="john.doe@example.com"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={saving || !formData.phoneNumber}>
                {saving ? 'Creating...' : 'Create Customer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Customer Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>Update customer information</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={editFormData.phoneNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Country</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={editFormData.country}
                  onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={saving || !editFormData.phoneNumber}>
                {saving ? 'Updating...' : 'Update Customer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create/Manage Group Modal */}
        <Dialog open={showGroupModal} onOpenChange={setShowGroupModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manage Customer Groups</DialogTitle>
              <DialogDescription>Create and manage groups to organize your customers</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Create New Group Form */}
              <div className="p-4 border rounded-lg space-y-3">
                <h4 className="font-medium">Create New Group</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Group name"
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    value={groupFormData.name}
                    onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                  />
                  <input
                    type="color"
                    className="h-10 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    value={groupFormData.color}
                    onChange={(e) => setGroupFormData({ ...groupFormData, color: e.target.value })}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Description (optional)"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={groupFormData.description}
                  onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                />
                <Button onClick={handleCreateGroup} disabled={saving || !groupFormData.name} size="sm">
                  {saving ? 'Creating...' : 'Create Group'}
                </Button>
              </div>

              {/* Existing Groups List */}
              <div>
                <h4 className="font-medium mb-3">Existing Groups ({groups.length})</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {groups.map((group) => (
                    <div key={group._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded" style={{ backgroundColor: group.color }} />
                        <div>
                          <p className="font-medium">{group.name}</p>
                          <p className="text-xs text-muted-foreground">{group.customerCount} customers</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => deleteGroup(group._id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setShowGroupModal(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add to Group Modal */}
        <Dialog open={showAddToGroupModal} onOpenChange={setShowAddToGroupModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Group</DialogTitle>
              <DialogDescription>Select a group to add {selectedCustomer?.name || 'this customer'} to</DialogDescription>
            </DialogHeader>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {groups
                .filter((group) => !selectedCustomer?.groups.includes(group._id))
                .map((group) => (
                  <button
                    key={group._id}
                    onClick={() => addToGroup(group._id)}
                    className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div className="h-8 w-8 rounded flex-shrink-0" style={{ backgroundColor: group.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{group.name}</p>
                      {group.description && <p className="text-xs text-muted-foreground truncate">{group.description}</p>}
                    </div>
                    <Badge variant="outline">{group.customerCount} members</Badge>
                  </button>
                ))}
              {groups.filter((group) => !selectedCustomer?.groups.includes(group._id)).length === 0 && (
                <p className="text-center text-muted-foreground py-8">Customer is already in all available groups</p>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddToGroupModal(false);
                  setSelectedCustomer(null);
                }}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
