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

  const normalizeEmail = (value: string) => value.trim().toLowerCase();

  /** Supabase returns 429 when Auth rate limits are hit (signup/login/email sends). */
  function formatAuthError(err: { message?: string; status?: number }, context: "signup" | "login"): string {
    const msg = (err.message || "").toLowerCase();
    if (err.status === 429 || msg.includes("rate") || msg.includes("too many")) {
      return context === "signup"
        ? "Signup limit reached (Supabase rate limit). Wait 15–60 minutes, or create users in Dashboard → Authentication → Users instead of signing up repeatedly."
        : "Too many login attempts. Wait a few minutes and try again.";
    }
    return err.message || (context === "signup" ? "Signup failed" : "Login failed");
  }

  const handleLogin = async () => {
    if (loginLoading) return;
    const email = normalizeEmail(loginEmail);
    if (!email || !loginPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoginLoading(true);
    const { error } = await signIn(email, loginPassword);
    setLoginLoading(false);

    if (error) {
      toast.error(formatAuthError(error as { message?: string; status?: number }, "login"));
    }
  };

  const handleSignup = async () => {
    if (signupLoading) return;
    const email = normalizeEmail(signupEmail);
    if (!email || !signupPassword || !signupFullName) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Do not validate email format here — Supabase Auth does that. A strict regex caused false "invalid email" errors.

    if (signupPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSignupLoading(true);

    const userMeta: Record<string, string> = {
      full_name: signupFullName.trim(),
    };
    const bio = signupBio.trim();
    if (bio) userMeta.bio = bio;
    const gh = signupGithub.trim();
    if (gh) userMeta.github_url = gh;
    const li = signupLinkedin.trim();
    if (li) userMeta.linkedin_url = li;
    const tw = signupTwitter.trim();
    if (tw) userMeta.twitter_url = tw;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: signupPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: userMeta,
      },
    });

    setSignupLoading(false);

    if (authError) {
      toast.error(formatAuthError(authError as { message?: string; status?: number }, "signup"));
      return;
    }

    setSelected("login");
    setLoginEmail(email);
    setLoginPassword(signupPassword);

    if (authData.session) {
      toast.success("Account created! You are logged in.");
      navigate("/");
      return;
    }

    toast.success(
      "Account created. If email confirmation is enabled, check your inbox — then log in here."
    );
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
