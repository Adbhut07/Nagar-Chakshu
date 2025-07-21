import AuthGuard from '@/components/AuthGuard';

export default function DashboardPage() {
  return (
    <AuthGuard requireRegistration={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to Your Dashboard!
              </h1>
              <p className="text-gray-600">
                You are now successfully authenticated and registered.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}