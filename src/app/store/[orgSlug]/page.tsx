'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Search, Phone, DollarSign, Zap, Shield, Filter, Tag, SlidersHorizontal } from 'lucide-react';
import { Button, Card, CardContent } from '@pg-prepaid/ui';

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
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'value-asc' | 'value-desc'>('price-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 12;

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
        // Auto-select detected operator if available
        if (data.detectedOperator) {
          setFilterByProvider(data.detectedOperator.code);
        }
      } else {
        setError(data.error || 'Failed to lookup phone number');
      }
    } catch (err: any) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    // TODO: Navigate to payment page
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
  }, [lookupData?.products, searchQuery, filterByProvider, sortBy]);

  // Paginate products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return filteredAndSortedProducts.slice(startIndex, endIndex);
  }, [filteredAndSortedProducts, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / PRODUCTS_PER_PAGE);

  const primaryColor = lookupData?.branding?.primaryColor || '#3b82f6';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div
        className="py-16 px-4"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%)`,
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {lookupData?.branding?.businessName || 'top-up worldwide'}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8">
            {lookupData?.branding?.description ||
              '99% of mobile recharges sent online arrive in 3 seconds.'}
          </p>

          {/* Search Box */}
          <Card className="max-w-2xl mx-auto shadow-lg">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">Ready to send a top-up?</h2>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  placeholder="Enter phone number (e.g., +1234567890)"
                  className="w-full pl-12 pr-4 py-4 text-lg border-2 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ focusRing: primaryColor }}
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                />
              </div>

              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}

              <Button
                className="w-full mt-4 py-6 text-lg font-semibold"
                style={{ backgroundColor: primaryColor }}
                onClick={handleLookup}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Looking up...
                  </div>
                ) : (
                  'Find Top-ups'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results Section */}
      {lookupData && (
        <div className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Discount Banner */}
            {lookupData.discount && (
              <div className="mb-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-xl shadow-md">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-yellow-400 flex items-center justify-center">
                      <Tag className="h-6 w-6 text-yellow-900" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xl font-bold text-yellow-900 mb-1">
                      🎉 Special Offer!
                    </p>
                    <p className="text-lg font-semibold text-yellow-800 mb-2">
                      {lookupData.discount.description}
                    </p>
                    <div className="inline-block px-4 py-2 bg-yellow-400 rounded-lg">
                      <p className="text-sm font-bold text-yellow-900">
                        {lookupData.discount.type === 'percentage'
                          ? `Save ${lookupData.discount.value}% on your purchase`
                          : `Save $${lookupData.discount.value}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Country & Operator Info */}
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="inline-block px-6 py-3 bg-blue-50 border-2 border-blue-400 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-blue-900">
                        Country Detected
                      </p>
                      <p className="text-lg font-bold text-blue-700">
                        {lookupData.country.name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detected Operator Banner */}
                {lookupData.detectedOperator && (
                  <div className="inline-block px-6 py-3 bg-green-50 border-2 border-green-400 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Phone className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-green-900">
                          Operator Detected
                        </p>
                        <p className="text-lg font-bold text-green-700">
                          {lookupData.detectedOperator.name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <h3 className="text-2xl font-bold mb-2">
                Available Top-ups for {lookupData.country.name}
              </h3>
              <p className="text-gray-600">
                Phone: {lookupData.phoneNumber.substring(0, 5)}...
                {lookupData.phoneNumber.substring(lookupData.phoneNumber.length - 4)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Showing {lookupData.products.length} of {lookupData.totalProducts} available products
              </p>
            </div>

            {/* Search and Filter Section */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Provider Filter */}
                <select
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={filterByProvider}
                  onChange={(e) => {
                    setFilterByProvider(e.target.value);
                    setCurrentPage(1); // Reset to first page when filter changes
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
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as any);
                    setCurrentPage(1); // Reset to first page when sort changes
                  }}
                >
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="value-asc">Value: Low to High</option>
                  <option value="value-desc">Value: High to Low</option>
                </select>
              </div>

              {/* Results count */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <p>
                  Showing {filteredAndSortedProducts.length} of {lookupData.products.length} products
                </p>
                {(searchQuery || filterByProvider !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterByProvider('all');
                    }}
                    className="text-primary hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedProducts.map((product: any) => (
                <Card
                  key={product.skuCode}
                  className="hover:shadow-lg transition-shadow cursor-pointer relative"
                  onClick={() => handleProductSelect(product)}
                >
                  <CardContent className="p-6">
                    {/* Discount Badge */}
                    {product.pricing.discountApplied && (
                      <div className="absolute top-4 right-4">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          SAVE{' '}
                          {lookupData.discount?.type === 'percentage'
                            ? `${lookupData.discount.value}%`
                            : `$${(
                                product.pricing.priceBeforeDiscount -
                                product.pricing.finalPrice
                              ).toFixed(2)}`}
                        </div>
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 pr-4">
                        <p className="text-sm text-gray-600 mb-1">
                          {product.providerName}
                        </p>
                        <h4 className="font-semibold text-lg">{product.name}</h4>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-5 w-5" style={{ color: primaryColor }} />
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">You send:</span>
                        <span className="font-semibold">
                          ${product.pricing.finalPrice.toFixed(2)}
                        </span>
                      </div>

                      {product.pricing.discountApplied && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Original price:</span>
                          <span className="line-through text-gray-400">
                            ${product.pricing.priceBeforeDiscount.toFixed(2)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">They receive:</span>
                        <span className="font-semibold text-green-600">
                          {product.benefitAmount} {product.benefitUnit}
                        </span>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Select & Pay
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredAndSortedProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">
                  {lookupData.products.length === 0
                    ? 'No products available for this number at the moment.'
                    : 'No products match your search criteria. Try adjusting your filters.'}
                </p>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2"
                >
                  Previous
                </Button>

                <div className="flex items-center gap-2">
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
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Features Section */}
      {!lookupData && (
        <div className="py-12 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Instant Delivery</h3>
                <p className="text-gray-600">
                  99% of top-ups delivered within 3 seconds
                </p>
              </div>

              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Secure & Safe</h3>
                <p className="text-gray-600">
                  Your payment information is encrypted and secure
                </p>
              </div>

              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Best Rates</h3>
                <p className="text-gray-600">
                  Competitive pricing with special offers
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-50 border-t mt-12">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-600">
          {lookupData?.branding?.supportEmail && (
            <p className="mb-2">
              Support: <a href={`mailto:${lookupData.branding.supportEmail}`} className="text-blue-600 hover:underline">
                {lookupData.branding.supportEmail}
              </a>
            </p>
          )}
          {lookupData?.branding?.supportPhone && (
            <p className="mb-2">
              Phone: <a href={`tel:${lookupData.branding.supportPhone}`} className="text-blue-600 hover:underline">
                {lookupData.branding.supportPhone}
              </a>
            </p>
          )}
          <p className="mt-4 text-gray-500">
            Powered by {lookupData?.branding?.businessName || 'Top-up Platform'}
          </p>
        </div>
      </footer>
    </div>
  );
}
