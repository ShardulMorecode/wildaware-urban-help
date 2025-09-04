import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Shield, Users, Database, Eye, EyeOff, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { species, safetyGuidelines, rescueOrgs, Species, SafetyGuideline, RescueOrg } from '@/data/wildlife-data';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'species' | 'guidelines' | 'rescue'>('species');
  const { toast } = useToast();

  // Simple admin authentication (in production, use proper auth)
  const ADMIN_PASSWORD = 'wildaware2024';

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast({
        title: "Access Granted",
        description: "Welcome to WildAware Admin Panel",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid password",
        variant: "destructive"
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Shield className="w-6 h-6 text-primary" />
                  Admin Access Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Admin Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter admin password"
                      className="pr-10"
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <Button onClick={handleLogin} className="w-full" variant="nature">
                  <Shield className="w-4 h-4 mr-2" />
                  Access Admin Panel
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Demo password: wildaware2024
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Admin Panel</h1>
          <p className="text-xl text-muted-foreground">
            Manage wildlife species, safety guidelines, and rescue organizations
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8">
          <Button
            variant={activeTab === 'species' ? 'default' : 'outline'}
            onClick={() => setActiveTab('species')}
            className="flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            Species ({species.length})
          </Button>
          <Button
            variant={activeTab === 'guidelines' ? 'default' : 'outline'}
            onClick={() => setActiveTab('guidelines')}
            className="flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Guidelines ({safetyGuidelines.length})
          </Button>
          <Button
            variant={activeTab === 'rescue' ? 'default' : 'outline'}
            onClick={() => setActiveTab('rescue')}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Rescue Orgs ({rescueOrgs.length})
          </Button>
        </div>

        {/* Species Management */}
        {activeTab === 'species' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Species Management</CardTitle>
                  <Button variant="nature" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Species
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {species.map((item) => (
                    <div key={item.id} className="border rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{item.commonName}</h4>
                            <span className={`px-2 py-1 rounded text-xs ${
                              item.riskLevel === 'high' ? 'bg-destructive text-destructive-foreground' :
                              item.riskLevel === 'medium' ? 'bg-warning text-warning-foreground' :
                              'bg-success text-success-foreground'
                            }`}>
                              {item.riskLevel} risk
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {item.keywords.map(keyword => (
                              <span key={keyword} className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Guidelines Management */}
        {activeTab === 'guidelines' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Safety Guidelines Management</CardTitle>
                  <Button variant="nature" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Guideline
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {safetyGuidelines.map((guideline) => {
                    const relatedSpecies = species.find(s => s.id === guideline.speciesId);
                    return (
                      <div key={guideline.id} className="border rounded-xl p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold mb-2">
                              {relatedSpecies?.commonName} Safety Protocol
                            </h4>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <h5 className="font-medium text-success mb-1">DO's ({guideline.dos.length})</h5>
                                <ul className="text-muted-foreground">
                                  {guideline.dos.slice(0, 2).map((item, idx) => (
                                    <li key={idx}>• {item.substring(0, 50)}...</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h5 className="font-medium text-destructive mb-1">DON'Ts ({guideline.donts.length})</h5>
                                <ul className="text-muted-foreground">
                                  {guideline.donts.slice(0, 2).map((item, idx) => (
                                    <li key={idx}>• {item.substring(0, 50)}...</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Rescue Organizations Management */}
        {activeTab === 'rescue' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Rescue Organizations Management</CardTitle>
                  <Button variant="nature" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Organization
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rescueOrgs.map((org) => (
                    <div key={org.id} className="border rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{org.name}</h4>
                            {org.hours.includes('24') && (
                              <span className="px-2 py-1 bg-success text-success-foreground rounded text-xs">
                                24/7
                              </span>
                            )}
                          </div>
                          <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">City:</span> {org.city}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Phone:</span> {org.phone}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Hours:</span> {org.hours}
                            </div>
                          </div>
                          <div className="mt-2">
                            <span className="text-muted-foreground text-sm">Species: </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {org.speciesSupported.map(species => (
                                <span key={species} className="px-2 py-1 bg-accent text-accent-foreground rounded text-xs">
                                  {species}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;