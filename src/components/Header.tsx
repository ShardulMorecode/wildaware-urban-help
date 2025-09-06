import { useState } from 'react';
import { Moon, Sun, Leaf, LogIn, LogOut, User, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, Link } from 'react-router-dom';

const Header = () => {
  const [city, setCity] = useState(() => localStorage.getItem('wildaware-city') || '');
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCityChange = (value: string) => {
    setCity(value);
    localStorage.setItem('wildaware-city', value);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Leaf className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold bg-gradient-nature bg-clip-text text-transparent">
            WildAware
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/chat" 
            className="text-sm font-medium transition-colors hover:text-primary"
            aria-label="Chat with AI assistant"
          >
            Chat
          </Link>
          <Link 
            to="/learn" 
            className="text-sm font-medium transition-colors hover:text-primary"
            aria-label="Learn about wildlife"
          >
            Learn
          </Link>
          <Link 
            to="/report" 
            className="text-sm font-medium transition-colors hover:text-primary"
            aria-label="Report sighting"
          >
            Report
          </Link>
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
          
          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/activity">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="View your activities"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">My Activities</span>
                </Button>
              </Link>
              <span className="hidden lg:inline text-sm text-muted-foreground">
                Welcome, {user.email?.split('@')[0]}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/auth')}
              aria-label="Sign in"
            >
              <LogIn className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Sign In</span>
            </Button>
          )}
          
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