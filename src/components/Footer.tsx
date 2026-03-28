import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Footer = () => {
  const [userCount, setUserCount] = useState(0);
  const [problemCount, setProblemCount] = useState(0);

  useEffect(() => {
    fetchCounts();
    
    // Set up real-time subscriptions
    const problemsChannel = supabase
      .channel('problems-count')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'problems' }, 
        () => fetchCounts()
      )
      .subscribe();

    const profilesChannel = supabase
      .channel('profiles-count')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' }, 
        () => fetchCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(problemsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  const fetchCounts = async () => {
    const { count: users } = await supabase
      .from("profiles")
      .select("*", { count: 'exact', head: true });
    
    const { count: problems } = await supabase
      .from("problems")
      .select("*", { count: 'exact', head: true });
    
    setUserCount(users || 0);
    setProblemCount(problems || 0);
  };

  return (
    <footer className="bg-card backdrop-blur-lg border-t border-border">
      <div className="w-full py-4">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 max-w-full px-12 mx-auto">
          {/* Left Section - Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-primary">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/browse" className="text-muted-foreground hover:text-primary transition-colors">
                  Browse Problems
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Center Section - Counters */}
          <div className="flex items-center gap-6 py-14">
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text">{userCount.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Users</div>
            </div>
            <div className="w-px h-16 bg-border"></div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text">{problemCount.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">Problems Posted</div>
            </div>
          </div>

          {/* Right Section - Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-secondary">Resources</h3>
            <ul className="space-y-2 mb-2">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </a>
              </li>
            </ul>
            
            {/* Social Links */}
            <div className="flex gap-2">
              <a href="#" className="glass p-2 rounded-full hover:bg-primary/20 transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="glass p-2 rounded-full hover:bg-primary/20 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="glass p-2 rounded-full hover:bg-primary/20 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="glass p-2 rounded-full hover:bg-primary/20 transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-2 pt-2 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 SolutioNet.al</p>
        </div>
      </div>
    </footer>
  );
};
