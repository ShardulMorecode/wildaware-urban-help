import { useState } from 'react';
import { Moon, Sun, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from 'next-themes';

const Header = () => {
  const [city, setCity] = useState(() => localStorage.getItem('wildaware-city') || '');
  const { theme, setTheme } = useTheme();

  const handleCityChange = (value: string) => {
    setCity(value);
    localStorage.setItem('wildaware-city', value);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold bg-gradient-nature bg-clip-text text-transparent">
            WildAware
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <a 
            href="/" 
            className="text-sm font-medium transition-colors hover:text-primary"
            aria-label="Home"
          >
            Chat
          </a>
          <a 
            href="/learn" 
            className="text-sm font-medium transition-colors hover:text-primary"
            aria-label="Learn about wildlife"
          >
            Learn
          </a>
          <a 
            href="/report" 
            className="text-sm font-medium transition-colors hover:text-primary"
            aria-label="Report sighting"
          >
            Report
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <Input
              placeholder="Your city..."
              value={city}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-32 rounded-xl"
              aria-label="Enter your city for local rescue services"
            />
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;