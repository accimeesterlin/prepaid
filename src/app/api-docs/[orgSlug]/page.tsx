"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Zap,
  Book,
  Copy,
  Check,
} from "lucide-react";

export default function ApiDocsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const [_orgSlug, setOrgSlug] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setOrgSlug(p.orgSlug));
  }, [params]);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({
    code,
    language,
    id,
  }: {
    code: string;
    language: string;
    id: string;
  }) => (
    <div className="relative">
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <span className="text-xs text-gray-400 uppercase">{language}</span>
        <button
          onClick={() => copyCode(code, id)}
          className="p-1 hover:bg-gray-700 rounded"
        >
          {copiedCode === id ? (
            <Check className="h-4 w-4 text-green-400" />
          ) : (
            <Copy className="h-4 w-4 text-gray-400" />
          )}
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Prepaid Minutes API Documentation
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Build powerful integrations with our RESTful API. Send prepaid mobile
          top-ups programmatically to customers worldwide.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <Zap className="h-8 w-8 text-indigo-600 mb-4" />
          <h3 className="font-semibold text-lg mb-2">Fast & Reliable</h3>
          <p className="text-gray-600 text-sm">
            99.9% uptime with automatic retries and webhook notifications
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <Shield className="h-8 w-8 text-indigo-600 mb-4" />
          <h3 className="font-semibold text-lg mb-2">Secure</h3>
          <p className="text-gray-600 text-sm">
            API key authentication with rate limiting and scope-based
            permissions
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <Book className="h-8 w-8 text-indigo-600 mb-4" />
          <h3 className="font-semibold text-lg mb-2">Well Documented</h3>
          <p className="text-gray-600 text-sm">
            Clear examples in multiple languages with detailed error codes
          </p>
        </div>
      </div>

      {/* Getting Started */}
      <section id="getting-started" className="mb-16 scroll-mt-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Getting Started
        </h2>
        <div className="bg-white rounded-lg shadow-sm border p-8 space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">1. Get Your API Key</h3>
            <p className="text-gray-600 mb-4">
              Navigate to your dashboard and create a new API key with the
              required scopes. Each API key has specific permissions (scopes)
              that determine what actions it can perform.
            </p>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Keep your API key secret! Never share it
                publicly or commit it to version control.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">
              2. Make Your First Request
            </h3>
            <p className="text-gray-600 mb-4">
              All API requests should include your API key in the Authorization
              header:
            </p>
            <CodeBlock
              id="first-request"
              language="bash"
              code={`curl -X GET https://api.example.com/api/v1/balance \\
  -H "Authorization: Bearer sk_live_your_api_key_here"`}
            />
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">3. Handle Responses</h3>
            <p className="text-gray-600 mb-4">
              All successful responses return JSON with a consistent structure:
            </p>
            <CodeBlock
              id="response-format"
              language="json"
              code={`{
  "success": true,
  "data": {
    // Response data here
  },
  "metadata": {
    "message": "Request successful"
  }
}`}
            />
          </div>
        </div>
      </section>

      {/* Authentication */}
      <section id="authentication" className="mb-16 scroll-mt-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Authentication
        </h2>
        <div className="bg-white rounded-lg shadow-sm border p-8 space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">
              API Key Authentication
            </h3>
            <p className="text-gray-600 mb-4">
              Include your API key in every request using the Authorization
              header with Bearer token:
            </p>
            <CodeBlock
              id="auth-header"
              language="bash"
              code={`Authorization: Bearer sk_live_your_api_key_here`}
            />
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Rate Limiting</h3>
            <p className="text-gray-600 mb-4">API keys have two rate limits:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
              <li>
                <strong>Per-Key Limit:</strong> Default 1,000 requests per hour
                per API key
              </li>
              <li>
                <strong>Organization Limit:</strong> Default 10,000 requests per
                hour across all keys
              </li>
            </ul>
            <p className="text-gray-600 mb-4">
              Rate limit information is included in response headers:
            </p>
            <CodeBlock
              id="rate-limit-headers"
              language="bash"
              code={`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 985
X-RateLimit-Reset: 1640995200`}
            />
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Scopes</h3>
            <p className="text-gray-600 mb-4">
              Each API key has specific scopes that determine what operations it
              can perform:
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Scope
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 font-mono text-sm">
                      balance:read
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      View account balance
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-sm">
                      balance:write
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Modify account balance (admin only)
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-sm">
                      transactions:read
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      View transaction history
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-sm">
                      transactions:create
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Create new transactions
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-sm">topup:send</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Send mobile top-ups
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-sm">
                      customer:read
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Read customer information
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-sm">
                      customer:update
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Update customer information
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-sm">
                      webhooks:read
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      View webhook logs
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-sm">admin:*</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Full administrative access
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section id="endpoints" className="mb-16 scroll-mt-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">API Endpoints</h2>

        {/* Balance Endpoints */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-6">
          <h3 className="text-2xl font-semibold mb-4">Balance</h3>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded font-mono text-sm font-semibold">
                  GET
                </span>
                <code className="text-lg">/api/v1/customers/:id/balance</code>
              </div>
              <p className="text-gray-600 mb-3">
                Get customer balance information
              </p>
              <p className="text-sm text-gray-500 mb-3">
                <strong>Required scope:</strong> balance:read
              </p>

              <h4 className="font-semibold mb-2">Example Request (cURL)</h4>
              <CodeBlock
                id="balance-get-curl"
                language="bash"
                code={`curl -X GET https://api.example.com/api/v1/customers/123/balance \\
  -H "Authorization: Bearer sk_live_your_api_key_here"`}
              />

              <h4 className="font-semibold mt-4 mb-2">
                Example Request (JavaScript)
              </h4>
              <CodeBlock
                id="balance-get-js"
                language="javascript"
                code={`const response = await fetch('https://api.example.com/api/v1/customers/123/balance', {
  headers: {
    'Authorization': 'Bearer sk_live_your_api_key_here'
  }
});
const data = await response.json();
console.log(data);`}
              />

              <h4 className="font-semibold mt-4 mb-2">
                Example Request (Python)
              </h4>
              <CodeBlock
                id="balance-get-python"
                language="python"
                code={`import requests

headers = {
    'Authorization': 'Bearer sk_live_your_api_key_here'
}

response = requests.get(
    'https://api.example.com/api/v1/customers/123/balance',
    headers=headers
)

data = response.json()
print(data)`}
              />

              <h4 className="font-semibold mt-4 mb-2">Response</h4>
              <CodeBlock
                id="balance-get-response"
                language="json"
                code={`{
  "success": true,
  "data": {
    "currentBalance": 100.50,
    "currency": "USD",
    "totalAssigned": 500.00,
    "totalUsed": 399.50
  }
}`}
              />
            </div>
          </div>
        </div>

        {/* Transaction Endpoints */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-6">
          <h3 className="text-2xl font-semibold mb-4">Transactions</h3>

          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded font-mono text-sm font-semibold">
                  POST
                </span>
                <code className="text-lg">/api/v1/transactions</code>
              </div>
              <p className="text-gray-600 mb-3">
                Create a new transaction (send top-up)
              </p>
              <p className="text-sm text-gray-500 mb-3">
                <strong>Required scope:</strong> transactions:create, topup:send
              </p>

              <h4 className="font-semibold mb-2">Request Body</h4>
              <CodeBlock
                id="transaction-create-body"
                language="json"
                code={`{
  "productId": "prod_123abc",
  "recipientPhone": "+1234567890",
  "paymentType": "balance"
}`}
              />

              <h4 className="font-semibold mt-4 mb-2">
                Example Request (cURL)
              </h4>
              <CodeBlock
                id="transaction-create-curl"
                language="bash"
                code={`curl -X POST https://api.example.com/api/v1/transactions \\
  -H "Authorization: Bearer sk_live_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "productId": "prod_123abc",
    "recipientPhone": "+1234567890",
    "paymentType": "balance"
  }'`}
              />

              <h4 className="font-semibold mt-4 mb-2">
                Example Request (JavaScript)
              </h4>
              <CodeBlock
                id="transaction-create-js"
                language="javascript"
                code={`const response = await fetch('https://api.example.com/api/v1/transactions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_live_your_api_key_here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    productId: 'prod_123abc',
    recipientPhone: '+1234567890',
    paymentType: 'balance'
  })
});
const data = await response.json();`}
              />

              <h4 className="font-semibold mt-4 mb-2">
                Example Request (Python)
              </h4>
              <CodeBlock
                id="transaction-create-python"
                language="python"
                code={`import requests

headers = {
    'Authorization': 'Bearer sk_live_your_api_key_here',
    'Content-Type': 'application/json'
}

payload = {
    'productId': 'prod_123abc',
    'recipientPhone': '+1234567890',
    'paymentType': 'balance'
}

response = requests.post(
    'https://api.example.com/api/v1/transactions',
    headers=headers,
    json=payload
)

data = response.json()
print(data)`}
              />

              <h4 className="font-semibold mt-4 mb-2">Response</h4>
              <CodeBlock
                id="transaction-create-response"
                language="json"
                code={`{
  "success": true,
  "data": {
    "_id": "txn_456def",
    "amount": 10.00,
    "status": "pending",
    "recipientPhone": "+1234567890",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}`}
              />
            </div>

            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded font-mono text-sm font-semibold">
                  GET
                </span>
                <code className="text-lg">
                  /api/v1/customers/:id/transactions
                </code>
              </div>
              <p className="text-gray-600 mb-3">
                Get transaction history for a customer
              </p>
              <p className="text-sm text-gray-500 mb-3">
                <strong>Required scope:</strong> transactions:read
              </p>

              <h4 className="font-semibold mb-2">Query Parameters</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 mb-3">
                <li>
                  <code>page</code> - Page number (default: 1)
                </li>
                <li>
                  <code>limit</code> - Results per page (default: 20, max: 100)
                </li>
                <li>
                  <code>testMode</code> - Filter by test mode: "true" (test
                  only), "false" (live only), or omit for all
                </li>
              </ul>

              <CodeBlock
                id="transactions-list-curl"
                language="bash"
                code={`curl -X GET "https://api.example.com/api/v1/customers/123/transactions?page=1&limit=20&testMode=false" \\
  -H "Authorization: Bearer sk_live_your_api_key_here"`}
              />
            </div>
          </div>
        </div>

        {/* Test Mode Endpoint */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-6">
          <h3 className="text-2xl font-semibold mb-4">Test Mode</h3>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded font-mono text-sm font-semibold">
                  GET
                </span>
                <code className="text-lg">
                  /api/v1/customer-portal/:orgSlug/test-mode
                </code>
              </div>
              <p className="text-gray-600 mb-3">
                Check if an organization is in test mode (public endpoint, no
                authentication required)
              </p>
              <p className="text-sm text-gray-500 mb-3">
                <strong>Required scope:</strong> None (public endpoint)
              </p>

              <h4 className="font-semibold mb-2">Path Parameters</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 mb-3">
                <li>
                  <code>orgSlug</code> - Organization slug
                </li>
              </ul>

              <h4 className="font-semibold mb-2">Example Request (cURL)</h4>
              <CodeBlock
                id="test-mode-curl"
                language="bash"
                code={`curl -X GET https://api.example.com/api/v1/customer-portal/your-org-slug/test-mode`}
              />

              <h4 className="font-semibold mt-4 mb-2">
                Example Request (JavaScript)
              </h4>
              <CodeBlock
                id="test-mode-js"
                language="javascript"
                code={`const response = await fetch('https://api.example.com/api/v1/customer-portal/your-org-slug/test-mode');
const data = await response.json();
console.log('Test mode:', data.testMode);`}
              />

              <h4 className="font-semibold mt-4 mb-2">Response</h4>
              <CodeBlock
                id="test-mode-response"
                language="json"
                code={`{
  "success": true,
  "data": {
    "testMode": true,
    "orgSlug": "your-org-slug",
    "orgName": "Your Organization Name"
  }
}`}
              />

              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Note:</strong> When test mode is enabled, all
                  transactions are validated but not actually processed by the
                  provider. This is useful for testing your integration without
                  incurring real charges or sending real top-ups.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Webhooks */}
      <section id="webhooks" className="mb-16 scroll-mt-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Webhooks</h2>
        <div className="bg-white rounded-lg shadow-sm border p-8 space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Overview</h3>
            <p className="text-gray-600 mb-4">
              Webhooks allow you to receive real-time notifications when events
              occur in your account. Configure webhook URLs in your dashboard to
              receive POST requests for transaction updates.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Webhook Events</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>
                <code>transaction.completed</code> - Transaction successfully
                completed
              </li>
              <li>
                <code>transaction.failed</code> - Transaction failed
              </li>
              <li>
                <code>balance.updated</code> - Customer balance changed
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">
              Webhook Payload Example
            </h3>
            <CodeBlock
              id="webhook-payload"
              language="json"
              code={`{
  "event": "transaction.completed",
  "data": {
    "transactionId": "txn_456def",
    "amount": 10.00,
    "recipientPhone": "+1234567890",
    "status": "completed",
    "completedAt": "2024-01-15T10:35:00Z"
  },
  "timestamp": "2024-01-15T10:35:01Z"
}`}
            />
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Retry Logic</h3>
            <p className="text-gray-600 mb-4">
              Webhooks are retried using exponential backoff:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Attempt 1: Immediate</li>
              <li>Attempt 2: After 1 minute</li>
              <li>Attempt 3: After 5 minutes</li>
              <li>Attempt 4: After 15 minutes</li>
              <li>Attempt 5: After 1 hour</li>
              <li>Attempt 6: After 6 hours</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">
              Signature Verification (Coming Soon)
            </h3>
            <p className="text-gray-600 mb-4">
              Verify webhook authenticity by checking the signature header:
            </p>
            <CodeBlock
              id="webhook-verify"
              language="javascript"
              code={`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const computed = hmac.update(JSON.stringify(payload)).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computed)
  );
}`}
            />
          </div>
        </div>
      </section>

      {/* Error Codes */}
      <section id="errors" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Error Handling
        </h2>
        <div className="bg-white rounded-lg shadow-sm border p-8 space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">
              Error Response Format
            </h3>
            <CodeBlock
              id="error-format"
              language="json"
              code={`{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient balance to complete transaction",
    "details": {
      "required": 10.00,
      "available": 5.50
    }
  }
}`}
            />
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Common Error Codes</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      HTTP Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 font-mono text-sm">
                      UNAUTHORIZED
                    </td>
                    <td className="px-6 py-4 text-sm">401</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Invalid or missing API key
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-sm">FORBIDDEN</td>
                    <td className="px-6 py-4 text-sm">403</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Insufficient permissions
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-sm">NOT_FOUND</td>
                    <td className="px-6 py-4 text-sm">404</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Resource not found
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-sm">
                      RATE_LIMIT_EXCEEDED
                    </td>
                    <td className="px-6 py-4 text-sm">429</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Rate limit exceeded
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-sm">
                      INSUFFICIENT_BALANCE
                    </td>
                    <td className="px-6 py-4 text-sm">400</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Insufficient balance
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-mono text-sm">
                      VALIDATION_ERROR
                    </td>
                    <td className="px-6 py-4 text-sm">400</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Invalid request data
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
