"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import authClient from "@/lib/auth-client";
import { useIncidents } from "@/lib/queries";
import { type Incident } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  ArrowRight,
  ChevronDown,
  CircleAlert,
  Clock3,
  LogOut,
  MapPinned,
  Radio,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

const MapView = dynamic(
  () => import("@/components/map/map-view").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-muted/60" />,
  },
);

const stats = [
  {
    label: "Incident visibility",
    value: "Live map",
    detail: "See active disaster zones and impact radiuses at a glance.",
    icon: MapPinned,
  },
  {
    label: "Response speed",
    value: "Real-time",
    detail: "Coordinate requests, volunteers, and field updates without delay.",
    icon: Radio,
  },
  {
    label: "Team alignment",
    value: "One channel",
    detail: "Admins, NGOs, victims, and volunteers operate in the same flow.",
    icon: Users,
  },
];

const steps = [
  {
    title: "Report or create an incident",
    description:
      "Admins and NGOs open incidents while victims can trigger SOS or resource requests tied to a location.",
  },
  {
    title: "Match needs to the map",
    description:
      "Teams filter by disaster type, urgency, and status to understand where support is needed most.",
  },
  {
    title: "Mobilize the right responders",
    description:
      "Volunteers, NGOs, and coordinators move from awareness to action with shared live context.",
  },
];

const features = [
  {
    title: "Live incident map",
    description:
      "Colored markers and impact zones make active disasters legible in seconds.",
    icon: MapPinned,
  },
  {
    title: "SOS-first workflow",
    description:
      "Victims can rapidly surface urgent needs without navigating a heavy dashboard.",
    icon: CircleAlert,
  },
  {
    title: "Role-based coordination",
    description:
      "Separate responsibilities for admins, NGOs, volunteers, and affected people.",
    icon: ShieldCheck,
  },
  {
    title: "Real-time chat",
    description:
      "Every incident gets its own communication thread for field-level updates.",
    icon: Radio,
  },
  {
    title: "Priority-aware requests",
    description:
      "Critical supplies like blood, medicine, food, and shelter are easy to triage.",
    icon: Clock3,
  },
  {
    title: "Mobile-native operations",
    description:
      "Map-first drawers and floating controls preserve situational awareness on phones.",
    icon: ArrowRight,
  },
];

const getColorFromName = (name: string) => {
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

function getMapCenter(incidents: Incident[]): [number, number] {
  if (incidents.length === 0) return [20.5937, 78.9629];

  const sample = incidents.slice(0, 8);
  const total = sample.reduce(
    (acc, incident) => {
      acc.lat += incident.lat;
      acc.lng += incident.lng;
      return acc;
    },
    { lat: 0, lng: 0 },
  );

  return [total.lat / sample.length, total.lng / sample.length];
}

export default function Home() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const { data: incidents = [] } = useIncidents();

  const handleSignOut = async () => {
    await authClient.signOut();
    useAuthStore.getState().reset();
    toast.success("Signed out");
    router.push("/sign-in");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const activeCount = incidents.filter(
    (incident) => incident.status === "active",
  ).length;
  const resolvedCount = incidents.filter(
    (incident) => incident.status === "resolved",
  ).length;
  const heroIncidents = incidents
    .filter((incident) => incident.status === "active")
    .slice(0, 12);
  const mapCenter = getMapCenter(heroIncidents);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(circle_at_top,_rgba(255,251,125,0.28),_transparent_55%)]" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-[rgba(60,22,31,0.08)] blur-3xl" />
        <div className="absolute left-0 top-[34rem] h-96 w-96 rounded-full bg-[rgba(214,72,39,0.08)] blur-3xl" />
      </div>

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-[rgba(60,22,31,0.18)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Disaster Coordination
            </p>
            <p className="text-lg font-bold tracking-tight">DisasterLink</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {!isLoading &&
            (user ? (
              <>
                <Link href="/dashboard">
                  <Button className="rounded-full px-5">Dashboard</Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-11 rounded-full border-border/60 bg-background/85 pl-1 pr-2 shadow-sm backdrop-blur-md"
                    >
                      <Avatar className="h-8 w-8 border border-border/50">
                        {user.image ? (
                          <AvatarImage src={user.image} alt={user.name || ""} />
                        ) : null}
                        <AvatarFallback
                          className={`text-[11px] font-semibold text-white ${getColorFromName(user.name || "")}`}
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-[9999] w-56 p-1.5">
                    <div className="px-2.5 py-2">
                      <p className="text-sm font-semibold">{user.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer gap-2 text-destructive"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" className="rounded-full">
                    Sign in
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="rounded-full px-5">Sign up</Button>
                </Link>
              </>
            ))}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-10 sm:px-6 lg:px-8 lg:pb-16">
        <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/75 shadow-[0_24px_80px_rgba(60,22,31,0.12)] backdrop-blur-sm">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_1.2fr]">
            <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
              <div className="max-w-xl">
                <span className="inline-flex rounded-full border border-[rgba(60,22,31,0.12)] bg-[rgba(255,251,125,0.55)] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-foreground">
                  Mission-critical response
                </span>
                <h1 className="mt-5 max-w-lg text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                  Coordinate disaster response from a live operational map.
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                  DisasterLink brings incidents, SOS requests, volunteers, and
                  NGO operations into one real-time surface built for speed
                  during floods, fires, earthquakes, and other emergencies.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link href={user ? "/dashboard" : "/sign-up"}>
                  <Button
                    size="lg"
                    className="h-12 w-full rounded-full px-6 text-sm font-semibold sm:w-auto"
                  >
                    {user ? "Open dashboard" : "Start coordinating"}
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 w-full rounded-full border-border/70 bg-background/80 px-6 text-sm font-semibold sm:w-auto"
                  >
                    How it works
                  </Button>
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-border/70 bg-background/72 p-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Active incidents
                  </p>
                  <p className="mt-2 text-3xl font-black tracking-tight">
                    {activeCount}
                  </p>
                </div>
                <div className="rounded-3xl border border-border/70 bg-background/72 p-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Resolved
                  </p>
                  <p className="mt-2 text-3xl font-black tracking-tight">
                    {resolvedCount}
                  </p>
                </div>
                <div className="rounded-3xl border border-border/70 bg-background/72 p-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Operating model
                  </p>
                  <p className="mt-2 text-xl font-black tracking-tight">
                    Map-first mobile UX
                  </p>
                </div>
              </div>
            </div>

            <div className="relative min-h-[30rem] border-t border-border/60 bg-[#f5ede6] lg:min-h-[44rem] lg:border-l lg:border-t-0">
              <div className="absolute inset-0">
                <MapView
                  incidents={heroIncidents}
                  center={mapCenter}
                  zoom={5}
                  className="[&_.leaflet-control-zoom]:!mb-6 [&_.leaflet-control-zoom]:!mr-6"
                />
              </div>

              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,rgba(255,248,242,0.92)_10%,rgba(255,248,242,0.38)_38%,rgba(255,248,242,0.08)_68%)]" />

              <div className="absolute left-4 top-28 right-4 z-[1001] sm:left-6 sm:top-32 sm:max-w-sm">
                <div className="rounded-[1.75rem] border border-white/60 bg-white/86 p-5 shadow-[0_16px_40px_rgba(60,22,31,0.12)] backdrop-blur-xl">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
                    Live coordination surface
                  </p>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-foreground">
                    See incidents. Route people. Resolve requests faster.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    The landing view mirrors the product: location is the source
                    of truth, and every action starts from the map.
                  </p>
                </div>
              </div>

              <div className="absolute bottom-4 left-4 right-4 z-[1001] grid gap-3 sm:left-6 sm:right-6 lg:grid-cols-3">
                {stats.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="rounded-[1.5rem] border border-white/60 bg-[rgba(255,255,255,0.84)] p-4 shadow-[0_12px_30px_rgba(60,22,31,0.1)] backdrop-blur-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            {item.label}
                          </p>
                          <p className="text-lg font-black tracking-tight">
                            {item.value}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="grid gap-6 rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-[0_20px_60px_rgba(60,22,31,0.08)] sm:p-8 lg:grid-cols-[0.8fr_1.2fr]"
        >
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              A response flow built around location, urgency, and roles.
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground">
              The platform keeps the map visible and moves details into drawers,
              cards, and incident-specific channels so teams never lose context.
            </p>
          </div>

          <div className="grid gap-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-[1.5rem] border border-border/70 bg-background/75 p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground">
                    0{index + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-[0_20px_60px_rgba(60,22,31,0.08)] sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
                Features
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Everything needed to coordinate field response from one surface.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              Built for hackathon speed, but structured around real operational
              patterns used in disaster management products.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-[1.75rem] border border-border/70 bg-background/78 p-5 transition-transform duration-200 hover:-translate-y-1"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-[rgba(60,22,31,0.12)] bg-primary px-6 py-8 text-primary-foreground shadow-[0_22px_70px_rgba(60,22,31,0.18)] sm:px-8 sm:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-primary-foreground/70">
                Ready to deploy
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Move from fragmented updates to a single operational picture.
              </h2>
              <p className="mt-4 text-sm leading-6 text-primary-foreground/78 sm:text-base">
                Launch the dashboard, open incidents, and coordinate requests
                with the map always in view.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={user ? "/dashboard" : "/sign-up"}>
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-12 rounded-full border border-white/10 bg-white px-6 text-sm font-semibold text-primary hover:bg-white/90"
                >
                  {user ? "Go to dashboard" : "Create an account"}
                </Button>
              </Link>
              {!user ? (
                <Link href="/sign-in">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-full border-white/20 bg-transparent px-6 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Sign in
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
