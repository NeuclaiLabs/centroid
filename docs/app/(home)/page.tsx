'use client'

import Link from "next/link"
import Image from "next/image"
import { Github, Code, Globe, Shield, Zap, ChevronRight, Users, Server, CircleDot } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import { GitHubStats } from "@/components/github-stats"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-24 md:py-32 space-y-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
              Open Source • Self-Hostable • Free Forever
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
              Deploy your applications <span className="text-primary">anywhere</span>
            </h1>
            <p className="max-w-[700px] text-muted-foreground text-lg md:text-xl">
              Centroid is a powerful, self-hostable platform that makes deploying and managing your applications
              simple, secure, and scalable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Button size="lg">
                Get Started
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg">
                <Github className="mr-2 h-4 w-4" />
                Star on GitHub
              </Button>
            </div>
          </div>
          <div className="relative mx-auto aspect-video overflow-hidden rounded-xl border bg-muted/50 md:w-full lg:w-10/12 xl:w-9/12">
            <Image
              src="/placeholder.svg?height=720&width=1280"
              alt="Centroid Dashboard"
              width={1280}
              height={720}
              className="object-cover"
              priority
            />
          </div>
        </section>

        {/* GitHub Stats */}
        <section className="border-y bg-muted/50">
          <div className="container py-12">
            <GitHubStats />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container py-24 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">
              Everything you need to deploy with confidence
            </h2>
            <p className="max-w-[700px] mx-auto text-muted-foreground text-lg">
              Centroid provides a complete platform for deploying and managing your applications, with all the
              features you need and none of the complexity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex flex-col space-y-2 p-6 border rounded-lg">
              <Server className="h-10 w-10 text-primary mb-2" />
              <h3 className="text-xl font-bold">Self-Hostable</h3>
              <p className="text-muted-foreground">
                Host on your own infrastructure. Keep full control of your data and applications.
              </p>
            </div>
            <div className="flex flex-col space-y-2 p-6 border rounded-lg">
              <Code className="h-10 w-10 text-primary mb-2" />
              <h3 className="text-xl font-bold">Open Source</h3>
              <p className="text-muted-foreground">
                100% open source code. Inspect, modify, and contribute to the codebase.
              </p>
            </div>
            <div className="flex flex-col space-y-2 p-6 border rounded-lg">
              <Globe className="h-10 w-10 text-primary mb-2" />
              <h3 className="text-xl font-bold">Multi-Cloud</h3>
              <p className="text-muted-foreground">
                Deploy to any cloud provider or your own infrastructure with the same workflow.
              </p>
            </div>
            <div className="flex flex-col space-y-2 p-6 border rounded-lg">
              <Shield className="h-10 w-10 text-primary mb-2" />
              <h3 className="text-xl font-bold">Secure by Default</h3>
              <p className="text-muted-foreground">
                Built with security in mind. Automatic HTTPS, secrets management, and more.
              </p>
            </div>
            <div className="flex flex-col space-y-2 p-6 border rounded-lg">
              <Zap className="h-10 w-10 text-primary mb-2" />
              <h3 className="text-xl font-bold">Instant Deployments</h3>
              <p className="text-muted-foreground">
                Deploy in seconds with our optimized build system and caching strategies.
              </p>
            </div>
            <div className="flex flex-col space-y-2 p-6 border rounded-lg">
              <Users className="h-10 w-10 text-primary mb-2" />
              <h3 className="text-xl font-bold">Team Collaboration</h3>
              <p className="text-muted-foreground">
                Built-in team management, permissions, and collaboration features.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="bg-muted/50 border-y">
          <div className="container py-24 space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">Self-host in minutes, not days</h2>
              <p className="max-w-[700px] mx-auto text-muted-foreground text-lg">
                Getting started with Centroid is simple. Follow these steps to deploy your first application.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-2xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold">Install Centroid</h3>
                <p className="text-muted-foreground">
                  Clone the repository and run our simple installation script on your server.
                </p>
                <div className="w-full max-w-md rounded-md bg-muted p-4">
                  <pre className="text-sm text-left overflow-x-auto">
                    <code>git clone https://github.com/yourusername/Centroid</code>
                  </pre>
                </div>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-2xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-bold">Configure Your Instance</h3>
                <p className="text-muted-foreground">
                  Set up your database, storage, and authentication settings through our simple UI.
                </p>
                <div className="relative w-full aspect-video overflow-hidden rounded-md border">
                  <Image
                    src="/placeholder.svg?height=200&width=350"
                    alt="Configuration UI"
                    width={350}
                    height={200}
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-2xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-bold">Deploy Your First App</h3>
                <p className="text-muted-foreground">
                  Connect your Git repository and deploy your first application with a single click.
                </p>
                <div className="relative w-full aspect-video overflow-hidden rounded-md border">
                  <Image
                    src="/placeholder.svg?height=200&width=350"
                    alt="Deployment UI"
                    width={350}
                    height={200}
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="community" className="container py-24 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">Loved by developers worldwide</h2>
            <p className="max-w-[700px] mx-auto text-muted-foreground text-lg">
              Join thousands of developers who trust Centroid for their deployment needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 border rounded-lg">
              <div className="flex items-center gap-4 mb-4">
                <Image
                  src="/placeholder.svg?height=48&width=48"
                  alt="User Avatar"
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div>
                  <h4 className="font-bold">Sarah Chen</h4>
                  <p className="text-sm text-muted-foreground">Senior DevOps Engineer</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                &ldquo;Centroid has transformed how our team handles deployments. The self-hosted aspect gives us the
                control we need while maintaining simplicity.&rdquo;
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <div className="flex items-center gap-4 mb-4">
                <Image
                  src="/placeholder.svg?height=48&width=48"
                  alt="User Avatar"
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div>
                  <h4 className="font-bold">Marcus Johnson</h4>
                  <p className="text-sm text-muted-foreground">CTO, TechStart</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                &ldquo;As a startup, we needed a deployment solution that could grow with us without breaking the bank.
                Centroid has been perfect for our needs.&rdquo;
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <div className="flex items-center gap-4 mb-4">
                <Image
                  src="/placeholder.svg?height=48&width=48"
                  alt="User Avatar"
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div>
                  <h4 className="font-bold">Elena Rodriguez</h4>
                  <p className="text-sm text-muted-foreground">Lead Developer</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                &ldquo;The ability to customize Centroid to our specific workflow has been a game-changer. We&apos;ve reduced
                deployment times by 70%.&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-muted/50 border-y">
          <div className="container py-24">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-4 lg:max-w-[50%]">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">
                  Ready to take control of your deployments?
                </h2>
                <p className="text-muted-foreground text-lg">
                  Start deploying your applications with Centroid today. It&apos;s free, open source, and designed for
                  developers like you.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg">
                  Get Started
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg">
                  <Github className="mr-2 h-4 w-4" />
                  View on GitHub
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CircleDot className="h-6 w-6" />
                <span className="text-xl font-bold">Centroid</span>
              </div>
              <p className="text-sm text-muted-foreground">Open source deployment platform for modern applications.</p>
            </div>
            <div className="space-y-4">
              <h3 className="font-medium">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#features" className="hover:text-primary">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Roadmap
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Changelog
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-medium">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/docs" className="hover:text-primary">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/docs/api" className="hover:text-primary">
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link href="#community" className="hover:text-primary">
                    Community
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    GitHub
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-medium">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Centroid. All rights reserved.
            </p>
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-twitter"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-linkedin"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
                <span className="sr-only">LinkedIn</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
