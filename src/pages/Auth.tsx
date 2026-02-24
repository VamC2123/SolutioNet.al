import { useState } from "react";
import { Card, CardBody, Input, Button, Tabs, Tab, Textarea } from "@nextui-org/react";
import { Mail, Lock, User as UserIcon, Github, Linkedin, Twitter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | number>("login");

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup form
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [signupBio, setSignupBio] = useState("");
  const [signupGithub, setSignupGithub] = useState("");
  const [signupLinkedin, setSignupLinkedin] = useState("");
  const [signupTwitter, setSignupTwitter] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate('/');
    return null;
  }

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoginLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setLoginLoading(false);

    if (error) {
      toast.error(error.message || "Login failed");
    }
  };

  const handleSignup = async () => {
    if (!signupEmail || !signupPassword || !signupFullName) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (signupPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSignupLoading(true);
    
    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: signupFullName,
        }
      }
    });

    if (authError) {
      setSignupLoading(false);
      toast.error(authError.message || "Signup failed");
      return;
    }

    // Update profile with additional details
    if (authData.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          bio: signupBio || null,
          github_url: signupGithub || null,
          linkedin_url: signupLinkedin || null,
          twitter_url: signupTwitter || null,
        })
        .eq("id", authData.user.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
      }
    }

    setSignupLoading(false);
    setSelected("login");
    setLoginEmail(signupEmail);
    setLoginPassword(signupPassword);
    toast.success("Account created! Please log in.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4">
      <div className="w-full max-w-2xl">
        <Link to="/" className="flex justify-center mb-8">
          <div className="text-3xl font-bold gradient-text">SolutioNet.al</div>
        </Link>

        <Card className="glass">
          <CardBody className="p-8">
            <Tabs
              fullWidth
              size="lg"
              selectedKey={selected as string}
              onSelectionChange={setSelected}
              className="mb-6"
            >
              <Tab key="login" title="Login">
                <div className="space-y-4 mt-6">
                  <Input
                    label="Email"
                    placeholder="Enter your email"
                    type="email"
                    value={loginEmail}
                    onValueChange={setLoginEmail}
                    startContent={<Mail className="h-4 w-4 text-muted-foreground" />}
                    variant="bordered"
                  />
                  <Input
                    label="Password"
                    placeholder="Enter your password"
                    type="password"
                    value={loginPassword}
                    onValueChange={setLoginPassword}
                    startContent={<Lock className="h-4 w-4 text-muted-foreground" />}
                    variant="bordered"
                  />
                  <Button
                    color="primary"
                    size="lg"
                    className="w-full"
                    onPress={handleLogin}
                    isLoading={loginLoading}
                  >
                    Login
                  </Button>
                </div>
              </Tab>

              <Tab key="signup" title="Sign Up">
                <div className="space-y-4 mt-6 max-h-[600px] overflow-y-auto pr-2">
                  <Input
                    label="Full Name"
                    placeholder="Enter your full name"
                    type="text"
                    value={signupFullName}
                    onValueChange={setSignupFullName}
                    startContent={<UserIcon className="h-4 w-4 text-muted-foreground" />}
                    variant="bordered"
                    isRequired
                  />
                  <Input
                    label="Email"
                    placeholder="Enter your email"
                    type="email"
                    value={signupEmail}
                    onValueChange={setSignupEmail}
                    startContent={<Mail className="h-4 w-4 text-muted-foreground" />}
                    variant="bordered"
                    isRequired
                  />
                  <Input
                    label="Password"
                    placeholder="Enter your password (min 6 characters)"
                    type="password"
                    value={signupPassword}
                    onValueChange={setSignupPassword}
                    startContent={<Lock className="h-4 w-4 text-muted-foreground" />}
                    variant="bordered"
                    isRequired
                  />
                  <Textarea
                    label="Bio"
                    placeholder="Tell us about yourself (optional)"
                    value={signupBio}
                    onValueChange={setSignupBio}
                    variant="bordered"
                    minRows={3}
                  />
                  <Input
                    label="GitHub URL"
                    placeholder="https://github.com/username (optional)"
                    type="url"
                    value={signupGithub}
                    onValueChange={setSignupGithub}
                    startContent={<Github className="h-4 w-4 text-muted-foreground" />}
                    variant="bordered"
                  />
                  <Input
                    label="LinkedIn URL"
                    placeholder="https://linkedin.com/in/username (optional)"
                    type="url"
                    value={signupLinkedin}
                    onValueChange={setSignupLinkedin}
                    startContent={<Linkedin className="h-4 w-4 text-muted-foreground" />}
                    variant="bordered"
                  />
                  <Input
                    label="Twitter URL"
                    placeholder="https://twitter.com/username (optional)"
                    type="url"
                    value={signupTwitter}
                    onValueChange={setSignupTwitter}
                    startContent={<Twitter className="h-4 w-4 text-muted-foreground" />}
                    variant="bordered"
                  />
                  <Button
                    color="primary"
                    size="lg"
                    className="w-full"
                    onPress={handleSignup}
                    isLoading={signupLoading}
                  >
                    Sign Up
                  </Button>
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
