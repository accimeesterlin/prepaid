'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Alert, AlertDescription } from '@pg-prepaid/ui';

interface User {
  id: string;
  email: string;
  roles: string[];
  orgId: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/v1/auth/me');

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">PG Prepaid Minutes</h1>
          <Button onClick={handleLogout} variant="outline">
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground mt-2">
              Welcome back! Manage your prepaid minutes platform.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {user && (
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your current session details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Email:</span>
                  <span className="text-muted-foreground">{user.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">User ID:</span>
                  <span className="text-muted-foreground font-mono text-sm">{user.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Organization ID:</span>
                  <span className="text-muted-foreground font-mono text-sm">{user.orgId}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-medium">Roles:</span>
                  <span className="text-muted-foreground">
                    {user.roles.map((role) => (
                      <span key={role} className="inline-block bg-secondary px-2 py-1 rounded text-xs mr-1">
                        {role}
                      </span>
                    ))}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Coming Soon Sections */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top-Up Transactions</CardTitle>
                <CardDescription>View and manage top-up history</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Coming soon in Phase 2...</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Catalog</CardTitle>
                <CardDescription>Browse available operators</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Coming soon in Phase 2...</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>Configure payment providers</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Coming soon in Phase 3...</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
                <CardDescription>Manage team and integrations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Coming soon in Phase 4...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
