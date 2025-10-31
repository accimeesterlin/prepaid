'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Search, Phone, DollarSign, Zap, Shield, Filter, Tag, SlidersHorizontal, Globe, CreditCard, CheckCircle, XCircle, Wifi, Banknote } from 'lucide-react';
import { Button, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, toast } from '@pg-prepaid/ui';

export default function PublicStorefrontPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [lookupData, setLookupData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterByProvider, setFilterByProvider] = useState<string>('all');
  const [filterByType, setFilterByType] = useState<'all' | 'plan' | 'prepaid'>('all');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'value-asc' | 'value-desc'>('price-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 12;

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | 'pgpay'>('stripe');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [amountError, setAmountError] = useState<string>('');
  const [estimatedReceive, setEstimatedReceive] = useState<{ value: number; currency: string } | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<any>(null);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);

  // Phone number validation
  const validatePhoneNumber = (phone: string): { valid: boolean; error?: string } => {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length < 10) {
      return { valid: false, error: 'Phone number is too short (minimum 10 digits)' };
    }

    if (cleaned.length > 15) {
      return { valid: false, error: 'Phone number is too long (maximum 15 digits)' };
    }

    // Basic international format check
    if (!cleaned.match(/^\d{10,15}$/)) {
      return { valid: false, error: 'Invalid phone number format' };
    }

    return { valid: true };
  };

  // Format phone number as user types
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters except +
    const cleaned = value.replace(/[^\d+]/g, '');
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    if (error) setError(null); // Clear error on change
  };

  // Fetch payment methods for the organization
  const fetchPaymentMethods = async () => {
    setPaymentMethodsLoading(true);
    try {
      const response = await fetch(`/api/v1/storefront/payment-methods?orgSlug=${orgSlug}`);
      const data = await response.json();

      if (response.ok) {
        setPaymentMethods(data);
      } else {
        console.error('Failed to fetch payment methods:', data.detail || data.message);
        setPaymentMethods({ available: false, methods: [] });
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setPaymentMethods({ available: false, methods: [] });
    } finally {
      setPaymentMethodsLoading(false);
    }
  };

  const handleLookup = async () => {
    const trimmed = phoneNumber.trim();

    if (!trimmed) {
      setError('Please enter a phone number');
      return;
    }

    // Validate phone number
    const validation = validatePhoneNumber(trimmed);
    if (!validation.valid) {
      setError(validation.error || 'Invalid phone number');
      return;
    }

    setLoading(true);
    setError(null);
    setLookupData(null);

    try {
      const response = await fetch('/api/v1/lookup/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          orgSlug,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setLookupData(data);
        // Reset to first page when new data loads
        setCurrentPage(1);
        // Reset provider filter to show all products
        setFilterByProvider('all');
        // Fetch payment methods for this organization
        await fetchPaymentMethods();
      } else {
        // API returns RFC 7807 Problem Details format with "detail" field
        setError(data.detail || data.error || data.message || 'Failed to lookup phone number');
      }
    } catch (err: any) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setShowPaymentModal(true);
    setPaymentStatus('idle');
    setEstimatedReceive(null);
    // Initialize custom amount for variable-value products
    if (product.isVariableValue && product.minAmount) {
      setCustomAmount(product.minAmount.toString());
    } else {
      setCustomAmount('');
    }
    setAmountError('');
  };

  // Fetch price estimate from DingConnect
  const fetchEstimate = async (amount: number, skuCode: string) => {
    if (!amount || amount <= 0) return;

    setIsEstimating(true);
    try {
      const response = await fetch('/api/v1/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgSlug,
          skuCode,
          sendValue: amount,
          sendCurrencyIso: 'USD',
        }),
      });

      const data = await response.json();

      if (response.ok && data.receiveValue !== undefined && data.receiveCurrency) {
        setEstimatedReceive({
          value: data.receiveValue,
          currency: data.receiveCurrency,
        });
      } else {
        console.error('Failed to fetch estimate:', data.detail || data.message || 'Invalid response format');
        setEstimatedReceive(null);
      }
    } catch (error) {
      console.error('Error fetching estimate:', error);
      setEstimatedReceive(null);
    } finally {
      setIsEstimating(false);
    }
  };

  // Debounce estimate calls when amount changes
  const estimateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (selectedProduct?.isVariableValue && customAmount) {
      const amount = parseFloat(customAmount);

      // Clear previous timeout
      if (estimateTimeoutRef.current) {
        clearTimeout(estimateTimeoutRef.current);
      }

      // Validate amount is within range
      if (isNaN(amount) || amount <= 0) {
        setEstimatedReceive(null);
        setAmountError('');
      } else if (amount < selectedProduct.minAmount) {
        setEstimatedReceive(null);
        setAmountError(`Minimum amount is $${selectedProduct.minAmount.toFixed(2)}`);
      } else if (amount > selectedProduct.maxAmount) {
        setEstimatedReceive(null);
        setAmountError(`Maximum amount is $${selectedProduct.maxAmount.toFixed(2)}`);
      } else {
        // Valid range - clear error and fetch estimate
        setAmountError('');
        estimateTimeoutRef.current = setTimeout(() => {
          fetchEstimate(amount, selectedProduct.skuCode);
        }, 500);
      }
    }

    return () => {
      if (estimateTimeoutRef.current) {
        clearTimeout(estimateTimeoutRef.current);
      }
    };
  }, [customAmount, selectedProduct]);

  const handlePayment = async () => {
    if (!customerEmail) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address to continue.',
        variant: 'error',
      });
      return;
    }

    if (!selectedProduct) return;

    // Validate custom amount for variable-value products
    if (selectedProduct.isVariableValue) {
      const amount = parseFloat(customAmount);
      if (isNaN(amount) || amount <= 0) {
        setAmountError('Please enter a valid amount');
        return;
      }
      if (amount < selectedProduct.minAmount) {
        setAmountError(`Amount must be at least $${selectedProduct.minAmount.toFixed(2)}`);
        return;
      }
      if (amount > selectedProduct.maxAmount) {
        setAmountError(`Amount cannot exceed $${selectedProduct.maxAmount.toFixed(2)}`);
        return;
      }
      setAmountError('');
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // Simulate payment processing (replace with actual payment API call)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // TODO: Call actual payment API endpoint
      // const response = await fetch('/api/v1/payments/process', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     orgSlug,
      //     phoneNumber: lookupData.phoneNumber,
      //     productSkuCode: selectedProduct.skuCode,
      //     customerEmail,
      //     paymentMethod,
      //     amount: selectedProduct.pricing.finalPrice,
      //   }),
      // });

      setPaymentStatus('success');

      // Determine what value was received
      const receivedAmount = selectedProduct.isVariableValue && estimatedReceive && estimatedReceive.value !== undefined
        ? `${estimatedReceive.value.toFixed(2)} ${estimatedReceive.currency}`
        : `${selectedProduct.benefitAmount} ${selectedProduct.benefitUnit}`;

      toast({
        title: 'Top-up Successful!',
        description: `${receivedAmount} has been sent to ${lookupData.phoneNumber}`,
        variant: 'success',
      });

      // Close modal after 3 seconds
      setTimeout(() => {
        setShowPaymentModal(false);
        setSelectedProduct(null);
        setCustomerEmail('');
        setPaymentStatus('idle');
      }, 3000);

    } catch (error: any) {
      setPaymentStatus('error');
      toast({
        title: 'Payment Failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Get unique providers from products
  const providers = useMemo(() => {
    if (!lookupData?.products) return [];
    const uniqueProviders = Array.from(
      new Set(lookupData.products.map((p: any) => p.providerName))
    );
    return uniqueProviders;
  }, [lookupData?.products]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    if (!lookupData?.products) return [];

    let filtered = [...lookupData.products];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product: any) =>
          product.name.toLowerCase().includes(query) ||
          product.providerName.toLowerCase().includes(query)
      );
    }

    // Apply provider filter
    if (filterByProvider !== 'all') {
      filtered = filtered.filter(
        (product: any) => product.providerCode === filterByProvider
      );
    }

    // Apply type filter (plan vs prepaid)
    if (filterByType !== 'all') {
      filtered = filtered.filter((product: any) => {
        // Plan classification:
        // - Has "Data" in the Benefits array, OR
        // - Has a ValidityPeriodIso value (e.g., "P30D")
        const hasDataBenefit = product.benefits?.includes('Data');
        const hasValidityPeriod = !!product.validityPeriod;
        const isPlan = hasDataBenefit || hasValidityPeriod;

        // Prepaid is everything that is NOT a plan
        const isPrepaid = !isPlan;

        if (filterByType === 'plan') return isPlan;
        if (filterByType === 'prepaid') return isPrepaid;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'price-asc':
          return a.pricing.finalPrice - b.pricing.finalPrice;
        case 'price-desc':
          return b.pricing.finalPrice - a.pricing.finalPrice;
        case 'value-asc':
          return a.benefitAmount - b.benefitAmount;
        case 'value-desc':
          return b.benefitAmount - a.benefitAmount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [lookupData?.products, searchQuery, filterByProvider, filterByType, sortBy]);

  // Paginate products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return filteredAndSortedProducts.slice(startIndex, endIndex);
  }, [filteredAndSortedProducts, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / PRODUCTS_PER_PAGE);

  const primaryColor = lookupData?.branding?.primaryColor || '#3b82f6';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b bg-card">
        <div className="container max-w-5xl mx-auto px-4 py-12">
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {lookupData?.branding?.businessName || 'Mobile Top-Up'}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
              {lookupData?.branding?.description ||
                'Send mobile top-ups worldwide instantly'}
            </p>
          </div>

          {/* Search Box */}
          <Card className="max-w-xl mx-auto shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel"
                    placeholder="+1234567890"
                    className="w-full pl-10 pr-4 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                  {error}
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleLookup}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Looking up...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Find Top-ups
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results Section */}
      {lookupData && (
        <div className="container max-w-5xl mx-auto px-4 py-8">
          {/* Discount Banner */}
          {lookupData.discount && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Tag className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg mb-1">
                      Special Offer!
                    </p>
                    <p className="text-muted-foreground mb-2">
                      {lookupData.discount.description}
                    </p>
                    <div className="inline-flex items-center px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm font-medium">
                      {lookupData.discount.type === 'percentage'
                        ? `Save ${lookupData.discount.value}%`
                        : `Save $${lookupData.discount.value}`}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Country & Operator Info */}
          <div className="mb-8 space-y-4">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{lookupData.country.name}</span>
              </div>

              {lookupData.detectedOperators && lookupData.detectedOperators.length > 0 && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {lookupData.detectedOperators.filter((op: any) => op.name).map((op: any) => op.name).join(', ')}
                  </span>
                </div>
              )}
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-2xl font-semibold">
                Available Top-ups
              </h2>
              <p className="text-sm text-muted-foreground">
                {lookupData.phoneNumber.substring(0, 5)}...{lookupData.phoneNumber.substring(lookupData.phoneNumber.length - 4)} • {lookupData.products.length} products
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg">
              <button
                onClick={() => {
                  setFilterByType('all');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  filterByType === 'all'
                    ? 'bg-background shadow-sm'
                    : 'hover:bg-background/50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setFilterByType('prepaid');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  filterByType === 'prepaid'
                    ? 'bg-background shadow-sm'
                    : 'hover:bg-background/50'
                }`}
              >
                Top-up
              </button>
              <button
                onClick={() => {
                  setFilterByType('plan');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  filterByType === 'plan'
                    ? 'bg-background shadow-sm'
                    : 'hover:bg-background/50'
                }`}
              >
                Plans
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Provider Filter */}
              <select
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                value={filterByProvider}
                onChange={(e) => {
                  setFilterByProvider(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Providers</option>
                {lookupData?.operators?.map((operator: any) => (
                  <option key={operator.code} value={operator.code}>
                    {operator.name}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
              >
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="value-asc">Value: Low to High</option>
                <option value="value-desc">Value: High to Low</option>
              </select>
            </div>

            {/* Results count */}
            {(searchQuery || filterByProvider !== 'all') && (
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">
                  Showing {filteredAndSortedProducts.length} of {lookupData.products.length} products
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterByProvider('all');
                  }}
                  className="text-primary hover:underline text-sm font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {/* Products List */}
          <div className="grid gap-3">
            {paginatedProducts.map((product: any) => {
              return (
                <Card
                  key={product.skuCode}
                  className="cursor-pointer hover:shadow-md transition-all group"
                  onClick={() => handleProductSelect(product)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: Product Info */}
                      <div className="flex-1 space-y-1">
                        {product.pricing.discountApplied && (
                          <div className="inline-flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-medium text-muted-foreground line-through">
                              ${product.pricing.priceBeforeDiscount.toFixed(2)}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                              Save {((product.pricing.priceBeforeDiscount - product.pricing.finalPrice) / product.pricing.priceBeforeDiscount * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                        <div className="flex items-baseline gap-2">
                          {product.isVariableValue ? (
                            <p className="text-lg font-semibold">
                              ${product.minAmount.toFixed(2)} - ${product.maxAmount.toFixed(2)}
                            </p>
                          ) : (
                            <p className="text-lg font-semibold">
                              {product.benefitAmount} {product.benefitUnit}
                            </p>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {product.providerName} • {product.name}
                        </p>
                      </div>

                      {/* Right: Price Button */}
                      <div className="flex-shrink-0">
                        <Button size="lg" className="group-hover:scale-105 transition-transform">
                          ${product.pricing.finalPrice.toFixed(2)}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredAndSortedProducts.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {lookupData.products.length === 0
                    ? 'No products available for this number at the moment.'
                    : 'No products match your search criteria. Try adjusting your filters.'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Features Section */}
      {!lookupData && (
        <div className="border-t bg-muted/30">
          <div className="container max-w-5xl mx-auto px-4 py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Instant Delivery</h3>
                <p className="text-sm text-muted-foreground">
                  99% of top-ups delivered within 3 seconds
                </p>
              </div>

              <div className="text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Secure & Safe</h3>
                <p className="text-sm text-muted-foreground">
                  Your payment information is encrypted and secure
                </p>
              </div>

              <div className="text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Best Rates</h3>
                <p className="text-sm text-muted-foreground">
                  Competitive pricing with special offers
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          {paymentStatus === 'idle' || paymentStatus === 'processing' ? (
            <>
              <DialogHeader>
                <DialogTitle>Complete Your Purchase</DialogTitle>
                <DialogDescription>
                  You're about to send a top-up to {lookupData?.phoneNumber}
                </DialogDescription>
              </DialogHeader>

              {selectedProduct && (
                <div className="space-y-4">
                  {/* Product Summary */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">{selectedProduct.name}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Provider:</span>
                        <span className="font-medium">{selectedProduct.providerName}</span>
                      </div>

                      {/* Custom Amount Input for Variable-Value Products */}
                      {selectedProduct.isVariableValue ? (
                        <div className="space-y-2 py-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Enter Amount (${selectedProduct.minAmount.toFixed(2)} - ${selectedProduct.maxAmount.toFixed(2)})
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                            <input
                              type="number"
                              min={selectedProduct.minAmount}
                              max={selectedProduct.maxAmount}
                              step="0.01"
                              value={customAmount}
                              onChange={(e) => {
                                setCustomAmount(e.target.value);
                              }}
                              disabled={isProcessing}
                              className={`w-full pl-7 pr-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                                amountError
                                  ? 'border-red-500 focus:ring-red-500'
                                  : 'border-gray-300 focus:ring-primary'
                              }`}
                              placeholder={`${selectedProduct.minAmount.toFixed(2)}`}
                            />
                          </div>
                          {amountError && (
                            <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                              <XCircle className="h-3 w-3" />
                              {amountError}
                            </div>
                          )}
                          {/* Estimated Receive Value */}
                          <div className="flex justify-between items-center text-sm pt-2">
                            <span className="text-gray-600">They receive:</span>
                            {isEstimating ? (
                              <span className="flex items-center gap-1 text-gray-500">
                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-400 border-t-transparent" />
                                Calculating...
                              </span>
                            ) : estimatedReceive && estimatedReceive.value !== undefined ? (
                              <span className="font-medium text-green-600">
                                {estimatedReceive.value.toFixed(2)} {estimatedReceive.currency}
                              </span>
                            ) : customAmount && parseFloat(customAmount) > 0 ? (
                              <span className="text-gray-400">Enter valid amount</span>
                            ) : null}
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-gray-600">They receive:</span>
                          <span className="font-medium text-green-600">
                            {selectedProduct.benefitAmount} {selectedProduct.benefitUnit}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t">
                        <span>Total:</span>
                        <span>
                          ${selectedProduct.isVariableValue && customAmount
                            ? parseFloat(customAmount).toFixed(2)
                            : selectedProduct.pricing.finalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Email */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      disabled={isProcessing}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      We'll send your receipt to this email
                    </p>
                  </div>

                  {/* Payment Method Selection - Only show if payment methods are available */}
                  {paymentMethods?.available && paymentMethods?.methods?.length > 0 ? (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Payment Method
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('stripe')}
                          disabled={isProcessing}
                          className={`p-3 border-2 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                            paymentMethod === 'stripe'
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <CreditCard className="h-5 w-5" />
                          <span className="text-xs font-medium">Card</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('paypal')}
                          disabled={isProcessing}
                          className={`p-3 border-2 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                            paymentMethod === 'paypal'
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <DollarSign className="h-5 w-5" />
                          <span className="text-xs font-medium">PayPal</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('pgpay')}
                          disabled={isProcessing}
                          className={`p-3 border-2 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                            paymentMethod === 'pgpay'
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Phone className="h-5 w-5" />
                          <span className="text-xs font-medium">PGPay</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Payment Methods Error Banner */
                    <div className="p-3 bg-red-50 border-2 border-red-400 rounded-lg">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-900 text-sm">Payment Methods Not Available</p>
                          <p className="text-xs text-red-800 mt-1">
                            This merchant has not configured any payment methods yet. Please contact support for assistance.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter className="flex-col gap-2">
                {/* Helper text when button is disabled */}
                {(amountError || (selectedProduct?.isVariableValue && isEstimating) || (!paymentMethods?.available || paymentMethods?.methods?.length === 0)) && (
                  <p className="text-xs text-gray-500 text-center w-full">
                    {amountError
                      ? 'Please enter a valid amount within the allowed range'
                      : isEstimating
                      ? 'Calculating price estimate...'
                      : (!paymentMethods?.available || paymentMethods?.methods?.length === 0)
                      ? 'Payment methods not configured'
                      : ''}
                  </p>
                )}

                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentModal(false)}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePayment}
                    disabled={
                      isProcessing ||
                      !!amountError ||
                      (selectedProduct?.isVariableValue && isEstimating) ||
                      (selectedProduct?.isVariableValue && !estimatedReceive && customAmount !== '') ||
                      (!paymentMethods?.available || paymentMethods?.methods?.length === 0)
                    }
                    style={{ backgroundColor: primaryColor }}
                    className={`flex-1 ${
                      isProcessing ||
                      !!amountError ||
                      (selectedProduct?.isVariableValue && isEstimating) ||
                      (selectedProduct?.isVariableValue && !estimatedReceive && customAmount !== '') ||
                      (!paymentMethods?.available || paymentMethods?.methods?.length === 0)
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Processing...
                      </div>
                    ) : isEstimating ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Calculating...
                      </div>
                    ) : (
                      `Pay $${selectedProduct?.isVariableValue && customAmount
                        ? parseFloat(customAmount).toFixed(2)
                        : selectedProduct?.pricing.finalPrice.toFixed(2)}`
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </>
          ) : paymentStatus === 'success' ? (
            <>
              <div className="text-center py-6">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <DialogTitle className="text-2xl mb-2">Payment Successful!</DialogTitle>
                <DialogDescription>
                  Your top-up has been sent successfully
                </DialogDescription>
                <div className="mt-4 p-4 bg-green-50 rounded-lg text-sm">
                  <p className="font-medium">
                    {selectedProduct?.isVariableValue && estimatedReceive && estimatedReceive.value !== undefined
                      ? `${estimatedReceive.value.toFixed(2)} ${estimatedReceive.currency}`
                      : `${selectedProduct?.benefitAmount} ${selectedProduct?.benefitUnit}`}
                  </p>
                  <p className="text-gray-600">sent to {lookupData?.phoneNumber}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-center py-6">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
                <DialogTitle className="text-2xl mb-2">Payment Failed</DialogTitle>
                <DialogDescription>
                  Something went wrong with your payment
                </DialogDescription>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentStatus('idle');
                  }}
                >
                  Close
                </Button>
                <Button
                  onClick={() => setPaymentStatus('idle')}
                  style={{ backgroundColor: primaryColor }}
                >
                  Try Again
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="container max-w-5xl mx-auto px-4 py-8">
          <div className="text-center space-y-2 text-sm text-muted-foreground">
            {lookupData?.branding?.supportEmail && (
              <p>
                Support:{' '}
                <a
                  href={`mailto:${lookupData.branding.supportEmail}`}
                  className="text-primary hover:underline"
                >
                  {lookupData.branding.supportEmail}
                </a>
              </p>
            )}
            {lookupData?.branding?.supportPhone && (
              <p>
                Phone:{' '}
                <a
                  href={`tel:${lookupData.branding.supportPhone}`}
                  className="text-primary hover:underline"
                >
                  {lookupData.branding.supportPhone}
                </a>
              </p>
            )}
            <p className="pt-4 border-t">
              Powered by {lookupData?.branding?.businessName || 'Mobile Top-Up Platform'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
