import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Key, Network, Type } from 'lucide-react';

export const Navigation: React.FC = () => {
  const location = useLocation();
  
  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">DNS Detective</span>
            </Link>
            
            <div className="flex space-x-4">
              <Button
                asChild
                variant={location.pathname === '/' ? 'default' : 'ghost'}
                size="sm"
              >
                <Link to="/" className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>DNS Detective</span>
                </Link>
              </Button>
              
              <Button
                asChild
                variant={location.pathname === '/dkim-lookup' ? 'default' : 'ghost'}
                size="sm"
              >
                <Link to="/dkim-lookup" className="flex items-center space-x-2">
                  <Key className="h-4 w-4" />
                  <span>Bulk DKIM Lookup</span>
                </Link>
              </Button>
              
              <Button
                asChild
                variant={location.pathname === '/ip-aggregator' ? 'default' : 'ghost'}
                size="sm"
              >
                <Link to="/ip-aggregator" className="flex items-center space-x-2">
                  <Network className="h-4 w-4" />
                  <span>IP Address Aggregator</span>
                </Link>
              </Button>
              
              <Button
                asChild
                variant={location.pathname === '/text-manipulations' ? 'default' : 'ghost'}
                size="sm"
              >
                <Link to="/text-manipulations" className="flex items-center space-x-2">
                  <Type className="h-4 w-4" />
                  <span>Text Manipulations</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};