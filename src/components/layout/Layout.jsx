import Navbar from './Navbar';

export default function Layout({ children, group, title, headerRight }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {title && (
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
            <h1 className="text-base font-semibold text-gray-900">{title}</h1>
            {headerRight && <div>{headerRight}</div>}
          </div>
        </header>
      )}
      <main className="max-w-lg mx-auto">{children}</main>
      <Navbar group={group} />
    </div>
  );
}
