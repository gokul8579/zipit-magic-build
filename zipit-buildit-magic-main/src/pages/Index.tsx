import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3, Target, Users, TrendingUp } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary">
      <nav className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <BarChart3 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">SalesHub CRM</span>
          </div>
          <Link to="/auth">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight">
              Manage Your Sales Pipeline
              <span className="block text-primary mt-2">Like a Pro</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Complete CRM solution for managing leads, customers, deals, and tasks. 
              Track your sales performance and grow your business.
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 border rounded-lg bg-card">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">Lead Management</h3>
              <p className="text-muted-foreground">
                Track and manage leads from multiple sources. Never miss an opportunity.
              </p>
            </div>

            <div className="p-6 border rounded-lg bg-card">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-50 rounded-xl">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">Customer Database</h3>
              <p className="text-muted-foreground">
                Maintain comprehensive customer records with full interaction history.
              </p>
            </div>

            <div className="p-6 border rounded-lg bg-card">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-purple-50 rounded-xl">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-2">Sales Pipeline</h3>
              <p className="text-muted-foreground">
                Visualize deals at every stage and forecast revenue accurately.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
