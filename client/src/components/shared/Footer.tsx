// src/components/shared/Footer.tsx
export default function Footer() {
    return (
      <footer className="w-full py-3 px-4 text-sm text-center text-muted-foreground bg-gray-50 dark:bg-gray-900 mt-auto">
        &copy; {new Date().getFullYear()} Bengaluru City Pulse · Made by Team Sahayog
      </footer>
    );
  }
  