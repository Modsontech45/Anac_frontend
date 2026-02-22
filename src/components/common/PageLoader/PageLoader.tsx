interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

const PageLoader = ({ message = 'Loading...', fullScreen = false }: PageLoaderProps) => {
  const containerClass = fullScreen
    ? 'min-h-screen flex items-center justify-center bg-gray-50'
    : 'flex items-center justify-center h-64';

  return (
    <div className={containerClass}>
      <div className="text-center">
        <div className="relative">
          <img
            src="/Logo.png"
            alt="ANAC"
            className="w-20 h-20 object-contain mx-auto animate-pulse"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        </div>
        <p className="mt-6 text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
};

export default PageLoader;
