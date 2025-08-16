export default function AuthPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-0 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="grid w-full h-screen max-w-none grid-cols-1 gap-0 md:grid-cols-2">
        <aside className="hidden md:flex items-center justify-center h-screen bg-gradient-to-br from-blue-600 to-indigo-800">
          <div className="relative h-full w-full overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="text-center text-white">
                <h1 className="text-4xl font-bold mb-4">
                  Welcome to College Connect
                </h1>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex items-center justify-center h-screen bg-white">
          <div className="w-full flex items-center justify-center">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
