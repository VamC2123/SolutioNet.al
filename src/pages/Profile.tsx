import { NavigationNew } from "@/components/NavigationNew";
import { Footer } from "@/components/Footer";
import { Card, CardBody, Button, Chip, Accordion, AccordionItem, Spinner, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea } from "@nextui-org/react";
import { Github, Linkedin, Twitter, Mail, Pencil, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Problem {
  id: string;
  pid: string;
  title: string;
  domain: string;
}

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [savedProblems, setSavedProblems] = useState<Problem[]>([]);
  const [followingProblems, setFollowingProblems] = useState<Problem[]>([]);
  const [votedProblems, setVotedProblems] = useState<Problem[]>([]);
  const [commentedProblems, setCommentedProblems] = useState<Problem[]>([]);
  const [contributedProblems, setContributedProblems] = useState<Problem[]>([]);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", bio: "", avatar_url: "", email: "", github_url: "", linkedin_url: "", twitter_url: "" });
  const [editSaving, setEditSaving] = useState(false);

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (authLoading || !user) return;
    fetchProfileData();
  }, [authLoading, user]);

  useEffect(() => {
    if (!user) return;

    // Real-time sync for saves
    const savesChannel = supabase
      .channel(`saves-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'saves',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchSavedProblems();
        }
      )
      .subscribe();

    // Real-time sync for follows
    const followsChannel = supabase
      .channel(`follows-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchFollowingProblems();
        }
      )
      .subscribe();

    // Real-time sync for votes
    const votesChannel = supabase
      .channel(`votes-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchVotedProblems();
        }
      )
      .subscribe();

    // Real-time sync for comments
    const commentsChannel = supabase
      .channel(`comments-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchCommentedProblems();
        }
      )
      .subscribe();

    // Real-time sync for contributions
    const problemsChannel = supabase
      .channel(`problems-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'problems',
          filter: `author_id=eq.${user.id}`
        },
        () => {
          fetchContributedProblems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(savesChannel);
      supabase.removeChannel(followsChannel);
      supabase.removeChannel(votesChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(problemsChannel);
    };
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      setProfile(profileData);
      setEditForm({
        full_name: profileData?.full_name ?? "",
        bio: profileData?.bio ?? "",
        avatar_url: profileData?.avatar_url ?? "",
        email: profileData?.email ?? user?.email ?? "",
        github_url: profileData?.github_url ?? "",
        linkedin_url: profileData?.linkedin_url ?? "",
        twitter_url: profileData?.twitter_url ?? "",
      });

      await Promise.all([
        fetchSavedProblems(),
        fetchFollowingProblems(),
        fetchVotedProblems(),
        fetchCommentedProblems(),
        fetchContributedProblems(),
      ]);
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedProblems = async () => {
    const { data: saves } = await supabase
      .from("saves")
      .select("problem_id, problems(id, pid, title, domain)")
      .eq("user_id", user.id);
    setSavedProblems(saves?.map((s: any) => s.problems) || []);
  };

  const fetchFollowingProblems = async () => {
    const { data: follows } = await supabase
      .from("follows")
      .select("problem_id, problems(id, pid, title, domain)")
      .eq("user_id", user.id);
    setFollowingProblems(follows?.map((f: any) => f.problems) || []);
  };

  const fetchVotedProblems = async () => {
    const { data: votes } = await supabase
      .from("votes")
      .select("problem_id, problems(id, pid, title, domain)")
      .eq("user_id", user.id);
    setVotedProblems(votes?.map((v: any) => v.problems) || []);
  };

  const fetchCommentedProblems = async () => {
    const { data: comments } = await supabase
      .from("comments")
      .select("problem_id, problems(id, pid, title, domain)")
      .eq("user_id", user.id);
    
    const uniqueProblems = Array.from(
      new Map(comments?.map((c: any) => [c.problems.id, c.problems]))
    ).map(([_, problem]) => problem as Problem);
    
    setCommentedProblems(uniqueProblems);
  };

  const fetchContributedProblems = async () => {
    const { data: problems } = await supabase
      .from("problems")
      .select("id, pid, title, domain")
      .eq("author_id", user.id);
    setContributedProblems(problems || []);
  };

  const openEditModal = () => {
    setEditForm({
      full_name: profile?.full_name ?? "",
      bio: profile?.bio ?? "",
      avatar_url: profile?.avatar_url ?? "",
      email: profile?.email ?? user?.email ?? "",
      github_url: profile?.github_url ?? "",
      linkedin_url: profile?.linkedin_url ?? "",
      twitter_url: profile?.twitter_url ?? "",
    });
    setEditModalOpen(true);
  };

  const saveProfile = async () => {
    setEditSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editForm.full_name || null,
          bio: editForm.bio || null,
          avatar_url: editForm.avatar_url || null,
          email: editForm.email || null,
          github_url: editForm.github_url || null,
          linkedin_url: editForm.linkedin_url || null,
          twitter_url: editForm.twitter_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (error) throw error;
      setProfile((p: any) => ({ ...p, ...editForm }));
      setEditModalOpen(false);
      toast.success("Profile updated.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update profile.");
    } finally {
      setEditSaving(false);
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }
    if (!user?.email) {
      toast.error("Cannot change password: no email.");
      return;
    }
    setPasswordSaving(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
      if (signInError) {
        toast.error("Current password is incorrect.");
        setPasswordSaving(false);
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      setPasswordModalOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  if (!user) return null;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen">
      <NavigationNew />
      
      <main className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <Card className="glass mb-8">
            <CardBody className="p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-4xl font-bold text-white">
                  {getInitials(profile?.full_name || "User")}
                </div>

                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{profile?.full_name || "User"}</h1>
                  {profile?.bio && <p className="text-muted-foreground mb-4">{profile.bio}</p>}
                  
                  <div className="flex flex-wrap gap-4 mb-4 text-muted-foreground">
                    <span><strong className="text-foreground">{contributedProblems.length}</strong> Contributions</span>
                    <span><strong className="text-foreground">{savedProblems.length}</strong> Saved</span>
                    <span><strong className="text-foreground">{followingProblems.length}</strong> Following</span>
                    <span><strong className="text-foreground">{votedProblems.length}</strong> Voted</span>
                  </div>

                  <div className="flex gap-3">
                    {profile?.github_url && (
                      <Button isIconOnly variant="flat" size="sm" color="primary" as="a" href={profile.github_url} target="_blank">
                        <Github className="h-5 w-5" />
                      </Button>
                    )}
                    {profile?.linkedin_url && (
                      <Button isIconOnly variant="flat" size="sm" color="primary" as="a" href={profile.linkedin_url} target="_blank">
                        <Linkedin className="h-5 w-5" />
                      </Button>
                    )}
                    {profile?.twitter_url && (
                      <Button isIconOnly variant="flat" size="sm" color="primary" as="a" href={profile.twitter_url} target="_blank">
                        <Twitter className="h-5 w-5" />
                      </Button>
                    )}
                    {profile?.email && (
                      <Button isIconOnly variant="flat" size="sm" color="primary" as="a" href={`mailto:${profile.email}`}>
                        <Mail className="h-5 w-5" />
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button color="primary" variant="flat" startContent={<Pencil className="h-4 w-4" />} onPress={openEditModal}>
                      Edit profile
                    </Button>
                    <Button color="default" variant="flat" startContent={<Lock className="h-4 w-4" />} onPress={() => setPasswordModalOpen(true)}>
                      Change password
                    </Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Modal isOpen={editModalOpen} onOpenChange={setEditModalOpen} size="2xl" scrollBehavior="inside">
            <ModalContent>
              <ModalHeader>Edit profile</ModalHeader>
              <ModalBody>
                <Input label="Full name" value={editForm.full_name} onValueChange={(v) => setEditForm((f) => ({ ...f, full_name: v }))} className="mb-2" />
                <Input label="Email" type="email" value={editForm.email} onValueChange={(v) => setEditForm((f) => ({ ...f, email: v }))} className="mb-2" />
                <Textarea label="Bio" value={editForm.bio} onValueChange={(v) => setEditForm((f) => ({ ...f, bio: v }))} minRows={2} className="mb-2" />
                <Input label="Avatar URL" value={editForm.avatar_url} onValueChange={(v) => setEditForm((f) => ({ ...f, avatar_url: v }))} className="mb-2" />
                <Input label="GitHub URL" value={editForm.github_url} onValueChange={(v) => setEditForm((f) => ({ ...f, github_url: v }))} className="mb-2" />
                <Input label="LinkedIn URL" value={editForm.linkedin_url} onValueChange={(v) => setEditForm((f) => ({ ...f, linkedin_url: v }))} className="mb-2" />
                <Input label="Twitter URL" value={editForm.twitter_url} onValueChange={(v) => setEditForm((f) => ({ ...f, twitter_url: v }))} />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={() => setEditModalOpen(false)}>Cancel</Button>
                <Button color="primary" onPress={saveProfile} isLoading={editSaving}>Save</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Modal isOpen={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
            <ModalContent>
              <ModalHeader>Change password</ModalHeader>
              <ModalBody>
                <Input type="password" label="Current password" value={currentPassword} onValueChange={setCurrentPassword} placeholder="Enter current password" className="mb-2" />
                <Input type="password" label="New password" value={newPassword} onValueChange={setNewPassword} placeholder="At least 6 characters" className="mb-2" />
                <Input type="password" label="Confirm new password" value={confirmPassword} onValueChange={setConfirmPassword} placeholder="Confirm new password" />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={() => setPasswordModalOpen(false)}>Cancel</Button>
                <Button color="primary" onPress={changePassword} isLoading={passwordSaving}>Update password</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Accordion variant="splitted" className="glass">
            <AccordionItem key="contributed" title={`Contributed Problems (${contributedProblems.length})`}>
              <div className="space-y-4">
                {contributedProblems.length > 0 ? (
                  contributedProblems.map((problem) => (
                    <RouterLink key={problem.id} to={`/problem/${problem.pid}`}>
                      <Card className="glass-hover cursor-pointer" isPressable>
                        <CardBody className="p-4">
                          <div className="flex items-center gap-3">
                            <Chip size="sm" variant="flat">{problem.domain}</Chip>
                            <h3 className="font-medium">{problem.title}</h3>
                          </div>
                        </CardBody>
                      </Card>
                    </RouterLink>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No contributed problems yet</p>
                )}
              </div>
            </AccordionItem>

            <AccordionItem key="saved" title={`Saved Problems (${savedProblems.length})`}>
              <div className="space-y-4">
                {savedProblems.length > 0 ? (
                  savedProblems.map((problem) => (
                    <RouterLink key={problem.id} to={`/problem/${problem.pid}`}>
                      <Card className="glass-hover cursor-pointer" isPressable>
                        <CardBody className="p-4">
                          <div className="flex items-center gap-3">
                            <Chip size="sm" variant="flat">{problem.domain}</Chip>
                            <h3 className="font-medium">{problem.title}</h3>
                          </div>
                        </CardBody>
                      </Card>
                    </RouterLink>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No saved problems yet</p>
                )}
              </div>
            </AccordionItem>

            <AccordionItem key="following" title={`Following Problems (${followingProblems.length})`}>
              <div className="space-y-4">
                {followingProblems.length > 0 ? (
                  followingProblems.map((problem) => (
                    <RouterLink key={problem.id} to={`/problem/${problem.pid}`}>
                      <Card className="glass-hover cursor-pointer" isPressable>
                        <CardBody className="p-4">
                          <div className="flex items-center gap-3">
                            <Chip size="sm" variant="flat">{problem.domain}</Chip>
                            <h3 className="font-medium">{problem.title}</h3>
                          </div>
                        </CardBody>
                      </Card>
                    </RouterLink>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No following problems yet</p>
                )}
              </div>
            </AccordionItem>

            <AccordionItem key="voted" title={`Voted Problems (${votedProblems.length})`}>
              <div className="space-y-4">
                {votedProblems.length > 0 ? (
                  votedProblems.map((problem) => (
                    <RouterLink key={problem.id} to={`/problem/${problem.pid}`}>
                      <Card className="glass-hover cursor-pointer" isPressable>
                        <CardBody className="p-4">
                          <div className="flex items-center gap-3">
                            <Chip size="sm" variant="flat">{problem.domain}</Chip>
                            <h3 className="font-medium">{problem.title}</h3>
                          </div>
                        </CardBody>
                      </Card>
                    </RouterLink>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No voted problems yet</p>
                )}
              </div>
            </AccordionItem>

            <AccordionItem key="commented" title={`Commented Problems (${commentedProblems.length})`}>
              <div className="space-y-4">
                {commentedProblems.length > 0 ? (
                  commentedProblems.map((problem) => (
                    <RouterLink key={problem.id} to={`/problem/${problem.pid}`}>
                      <Card className="glass-hover cursor-pointer" isPressable>
                        <CardBody className="p-4">
                          <div className="flex items-center gap-3">
                            <Chip size="sm" variant="flat">{problem.domain}</Chip>
                            <h3 className="font-medium">{problem.title}</h3>
                          </div>
                        </CardBody>
                      </Card>
                    </RouterLink>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No commented problems yet</p>
                )}
              </div>
            </AccordionItem>
          </Accordion>
        </div>
      </main>

      <Footer />
    </div>
  );
}