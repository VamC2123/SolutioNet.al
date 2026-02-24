import { NavigationNew } from "@/components/NavigationNew";
import { Footer } from "@/components/Footer";
import { Lightbulb, Users, Target, Rocket } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen">
      <NavigationNew />
      
      <main className="pt-24 pb-20">
        <div className="max-w-full px-12 mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4 gradient-text">About SolutioNet.al</h1>
            <p className="text-xl text-muted-foreground">
              Connecting problem-finders with problem-solvers
            </p>
          </div>

          <div className="space-y-12">
          <div className="glass rounded-2xl p-8">
              <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
              SolutioNet.al envisions a world where every research problem finds its solution through 
              collaborative innovation. We're building a bridge between problem-finders and problem-solvers, 
              creating an ecosystem where ideas flourish, research accelerates, and real-world challenges 
              meet creative minds ready to tackle them.
              </p>
            </div>

            <div className="glass rounded-2xl p-8">
              <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                SolutioNet.al is dedicated to accelerating innovation by creating a collaborative ecosystem 
                where researchers, students, and innovators can share real-world problems and develop solutions 
                together. We believe that every challenge deserves multiple perspectives and creative approaches.
              </p>
            </div>

            <div className=" max-w-7x1 mx-auto px-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-6">
                <div className="p-3 rounded-full bg-primary/20 w-fit mb-4">
                  <Lightbulb className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Innovation First</h3>
                <p className="text-muted-foreground">
                  We prioritize creative thinking and novel approaches to solve complex problems.
                </p>
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="p-3 rounded-full bg-secondary/20 w-fit mb-4">
                  <Users className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Collaborative Community</h3>
                <p className="text-muted-foreground">
                  Building bridges between disciplines and connecting minds across the globe.
                </p>
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="p-3 rounded-full bg-primary/20 w-fit mb-4">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Problem-Driven</h3>
                <p className="text-muted-foreground">
                  Focusing on real-world challenges that need innovative solutions.
                </p>
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="p-3 rounded-full bg-secondary/20 w-fit mb-4">
                  <Rocket className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Research Accelerator</h3>
                <p className="text-muted-foreground">
                  Speeding up the journey from problem identification to solution implementation.
                </p>
              </div>
            </div>

            <div className="glass rounded-2xl p-8 ">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Post a Problem</h3>
                    <p className="text-muted-foreground">Share your research challenge with detailed context and scope</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Community Engagement</h3>
                    <p className="text-muted-foreground">Researchers and innovators explore, discuss, and vote on problems</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Propose Solutions</h3>
                    <p className="text-muted-foreground">Submit abstracts of potential solutions with your innovative approach</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Collaborate & Refine</h3>
                    <p className="text-muted-foreground">Work together to develop and implement the best solutions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
