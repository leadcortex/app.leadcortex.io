//frontend\routes\onboarding.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, useId } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronDown,
  Info,
  X,
  ExternalLink,
  SkipForward,
  AlertTriangle,
  Key,
  Sparkles,
  User,
  Users,
  Building2,
  MoreHorizontal,
  Mail,
  Layers,
  Code2,
  DollarSign,
  HeartPulse,
  Factory,
  ShoppingBag,
  Circle,
  TrendingUp,
  Rocket,
  Flame,
  Zap,
  Briefcase,
  Smile,
  Crosshair,
  MessageSquare,
  Laptop,
  Heart,
  Phone,
  Calendar,
  Video,
  Handshake,
  GraduationCap,
  Home,
  Truck,
  Newspaper,
  Bed,
  HelpCircle,
  BookOpen,
  Minus,
  Shield,
  Laugh,
  Target,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { OnboardingSkeleton } from "@/components/skeletons";

type IconProps = { className?: string };

const AnthropicIcon = ({ className = "size-5" }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    fillRule="evenodd"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z" />
  </svg>
);

const OpenAIIcon = ({ className = "size-5" }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    fillRule="evenodd"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z" />
  </svg>
);

const GeminiIcon = ({ className = "size-5" }: IconProps) => {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z"
        fill="#3186FF"
      />
      <path
        d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z"
        fill={`url(#${id}-g0)`}
      />
      <path
        d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z"
        fill={`url(#${id}-g1)`}
      />
      <path
        d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z"
        fill={`url(#${id}-g2)`}
      />
      <defs>
        <linearGradient
          id={`${id}-g0`}
          gradientUnits="userSpaceOnUse"
          x1="7"
          x2="11"
          y1="15.5"
          y2="12"
        >
          <stop stopColor="#08B962" />
          <stop offset="1" stopColor="#08B962" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id={`${id}-g1`}
          gradientUnits="userSpaceOnUse"
          x1="8"
          x2="11.5"
          y1="5.5"
          y2="11"
        >
          <stop stopColor="#F94543" />
          <stop offset="1" stopColor="#F94543" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id={`${id}-g2`}
          gradientUnits="userSpaceOnUse"
          x1="3.5"
          x2="17.5"
          y1="13.5"
          y2="12"
        >
          <stop stopColor="#FABC12" />
          <stop offset=".46" stopColor="#FABC12" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const GroqIcon = ({ className = "size-5" }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    fillRule="evenodd"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M12.036 2c-3.853-.035-7 3-7.036 6.781-.035 3.782 3.055 6.872 6.908 6.907h2.42v-2.566h-2.292c-2.407.028-4.38-1.866-4.408-4.23-.029-2.362 1.901-4.298 4.308-4.326h.1c2.407 0 4.358 1.915 4.365 4.278v6.305c0 2.342-1.944 4.25-4.323 4.279a4.375 4.375 0 01-3.033-1.252l-1.851 1.818A7 7 0 0012.029 22h.092c3.803-.056 6.858-3.083 6.879-6.816v-6.5C18.907 4.963 15.817 2 12.036 2z" />
  </svg>
);

const MistralIcon = ({ className = "size-5" }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M3.428 3.4h3.429v3.428H3.428V3.4zm13.714 0h3.43v3.428h-3.43V3.4z" fill="gold" />
    <path
      d="M3.428 6.828h6.857v3.429H3.429V6.828zm10.286 0h6.857v3.429h-6.857V6.828z"
      fill="#FFAF00"
    />
    <path d="M3.428 10.258h17.144v3.428H3.428v-3.428z" fill="#FF8205" />
    <path
      d="M3.428 13.686h3.429v3.428H3.428v-3.428zm6.858 0h3.429v3.428h-3.429v-3.428zm6.856 0h3.43v3.428h-3.43v-3.428z"
      fill="#FA500F"
    />
    <path d="M0 17.114h10.286v3.429H0v-3.429zm13.714 0H24v3.429H13.714v-3.429z" fill="#E10500" />
  </svg>
);

const PerplexityIcon = ({ className = "size-5" }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    fillRule="evenodd"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M19.785 0v7.272H22.5V17.62h-2.935V24l-7.037-6.194v6.145h-1.091v-6.152L4.392 24v-6.465H1.5V7.188h2.884V0l7.053 6.494V.19h1.09v6.49L19.786 0zm-7.257 9.044v7.319l5.946 5.234V14.44l-5.946-5.397zm-1.099-.08l-5.946 5.398v7.235l5.946-5.234V8.965zm8.136 7.58h1.844V8.349H13.46l6.105 5.54v2.655zm-8.982-8.28H2.59v8.195h1.8v-2.576l6.192-5.62zM5.475 2.476v4.71h5.115l-5.115-4.71zm13.219 0l-5.115 4.71h5.115v-4.71z" />
  </svg>
);

const DeepSeekIcon = ({ className = "size-5" }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z"
      fill="#4D6BFE"
    />
  </svg>
);

/* -------------------------------------------------------------------------- */
/*  Logos réseaux sociaux                                                     */
/* -------------------------------------------------------------------------- */

const LinkedInBrand = ({ className = "size-4" }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    aria-hidden="true"
  >
    <rect width="24" height="24" rx="4" fill="#0A66C2" />
    <path
      fill="#FFFFFF"
      d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"
    />
  </svg>
);

const WhatsAppBrand = ({ className = "size-4" }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    aria-hidden="true"
  >
    <path
      fill="#25D366"
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
    />
  </svg>
);

const InstagramBrand = ({ className = "size-4" }: IconProps) => {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${id}-instagram`} cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#FDF497" />
          <stop offset="5%" stopColor="#FDF497" />
          <stop offset="45%" stopColor="#FD5949" />
          <stop offset="60%" stopColor="#D6249F" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill={`url(#${id}-instagram)`} />
      <rect
        x="5.25"
        y="5.25"
        width="13.5"
        height="13.5"
        rx="3.75"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="3.25" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
      <circle cx="16.85" cy="7.25" r="1.05" fill="#FFFFFF" />
    </svg>
  );
};

/* -------------------------------------------------------------------------- */
/*  Icônes par option                                                         */
/* -------------------------------------------------------------------------- */

const optionIcons: Record<string, React.ReactNode> = {
  "Founder solo": <User className="size-4" strokeWidth={1.75} />,
  "Petite équipe (2-5)": <Users className="size-4" strokeWidth={1.75} />,
  Agence: <Building2 className="size-4" strokeWidth={1.75} />,
  Autre: <MoreHorizontal className="size-4" strokeWidth={1.75} />,

  Instagram: <InstagramBrand className="size-4" />,
  LinkedIn: <LinkedInBrand className="size-4" />,
  WhatsApp: <WhatsAppBrand className="size-4" />,
  Email: <Mail className="size-4" strokeWidth={1.75} />,
  "Multi-canal": <Layers className="size-4" strokeWidth={1.75} />,

  "Tech / IT": <Code2 className="size-4" strokeWidth={1.75} />,
  Finance: <DollarSign className="size-4" strokeWidth={1.75} />,
  Santé: <HeartPulse className="size-4" strokeWidth={1.75} />,
  Industrie: <Factory className="size-4" strokeWidth={1.75} />,
  Commerce: <ShoppingBag className="size-4" strokeWidth={1.75} />,

  "Moins de 10": <Circle className="size-4" strokeWidth={1.75} />,
  "10-50": <TrendingUp className="size-4" strokeWidth={1.75} />,
  "50-200": <Rocket className="size-4" strokeWidth={1.75} />,
  "200+": <Flame className="size-4" strokeWidth={1.75} />,
  "500+": <Flame className="size-4" strokeWidth={1.75} />,
  "1000+": <Zap className="size-4" strokeWidth={1.75} />,
  "Objectif qualitatif": <Target className="size-4" strokeWidth={1.75} />,
  "Pas encore défini": <HelpCircle className="size-4" strokeWidth={1.75} />,

  Formel: <Briefcase className="size-4" strokeWidth={1.75} />,
  Décontracté: <Smile className="size-4" strokeWidth={1.75} />,
  Direct: <Crosshair className="size-4" strokeWidth={1.75} />,
  Consultatif: <MessageSquare className="size-4" strokeWidth={1.75} />,
  Inspirant: <Sparkles className="size-4" strokeWidth={1.75} />,
  Empathique: <Heart className="size-4" strokeWidth={1.75} />,
  Humoristique: <Laugh className="size-4" strokeWidth={1.75} />,
  Autoritaire: <Shield className="size-4" strokeWidth={1.75} />,
  Pédagogique: <BookOpen className="size-4" strokeWidth={1.75} />,
  Minimaliste: <Minus className="size-4" strokeWidth={1.75} />,

  Consultant: <Briefcase className="size-4" strokeWidth={1.75} />,
  Freelance: <Laptop className="size-4" strokeWidth={1.75} />,
  "Scale-up": <TrendingUp className="size-4" strokeWidth={1.75} />,
  "Grande entreprise": <Building2 className="size-4" strokeWidth={1.75} />,
  Association: <Heart className="size-4" strokeWidth={1.75} />,

  Téléphone: <Phone className="size-4" strokeWidth={1.75} />,
  Événement: <Calendar className="size-4" strokeWidth={1.75} />,
  Webinaire: <Video className="size-4" strokeWidth={1.75} />,
  Communauté: <Users className="size-4" strokeWidth={1.75} />,
  Partenaire: <Handshake className="size-4" strokeWidth={1.75} />,

  Éducation: <GraduationCap className="size-4" strokeWidth={1.75} />,
  Immobilier: <Home className="size-4" strokeWidth={1.75} />,
  Transport: <Truck className="size-4" strokeWidth={1.75} />,
  Énergie: <Zap className="size-4" strokeWidth={1.75} />,
  Média: <Newspaper className="size-4" strokeWidth={1.75} />,
  Hôtellerie: <Bed className="size-4" strokeWidth={1.75} />,
};

function OptionIcon({ label, active }: { label: string; active?: boolean }) {
  const icon = optionIcons[label];
  if (!icon) return null;
  return (
    <span
      className={`shrink-0 inline-flex items-center justify-center transition-colors ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
      aria-hidden="true"
    >
      {icon}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Guides fournisseurs — alignés sur AI_BRANDS (model-selector-types.ts)     */
/*                                                                            */
/*  ⚠️ NE PAS AJOUTER de fournisseur qui n'existe pas dans `AI_BRANDS`.        */
/*  Aujourd'hui : Claude, Gemini, ChatGPT, Perplexity, DeepSeek, Mistral,    */
/*  Groq. Cohere a été retiré — il n'est plus proposé dans l'app.            */
/* -------------------------------------------------------------------------- */

interface ProviderGuide {
  name: string;
  icon: React.ReactNode;
  steps: string[];
  link: string;
  linkLabel: string;
  /** Vrai si la marque est disponible SANS clé API (modèles inclus). */
  included?: boolean;
}

const providerGuides: ProviderGuide[] = [
  {
    name: "Anthropic",
    icon: <AnthropicIcon />,
    included: true,
    steps: [
      "Rendez-vous sur console.anthropic.com et connectez-vous.",
      "Dans le menu de gauche, cliquez sur « API Keys ».",
      "Cliquez sur « Create Key », donnez-lui un nom (ex. « LeadCortex »).",
      "Copiez la clé générée (elle commence par « sk-ant- »).",
      "Collez-la dans le champ ci-contre. Elle est chiffrée côté client.",
    ],
    link: "https://console.anthropic.com/settings/keys",
    linkLabel: "Ouvrir la console Anthropic",
  },
  {
    name: "OpenAI",
    icon: <OpenAIIcon />,
    included: true,
    steps: [
      "Rendez-vous sur platform.openai.com et connectez-vous.",
      "Cliquez sur votre avatar en haut à droite, puis « API Keys ».",
      "Cliquez sur « Create new secret key ».",
      "Donnez-lui un nom, puis copiez la clé (elle commence par « sk- »).",
      "Collez-la dans le champ ci-contre. Elle est chiffrée côté client.",
    ],
    link: "https://platform.openai.com/api-keys",
    linkLabel: "Ouvrir la plateforme OpenAI",
  },
  {
    name: "Google Gemini",
    icon: <GeminiIcon />,
    included: true,
    steps: [
      "Rendez-vous sur aistudio.google.com et connectez-vous.",
      "Dans le menu de gauche, cliquez sur « Get API key ».",
      "Cliquez sur « Create API key » dans un projet existant ou nouveau.",
      "Copiez la clé générée (elle commence par « AIza »).",
      "Collez-la dans le champ ci-contre. Elle est chiffrée côté client.",
    ],
    link: "https://aistudio.google.com/app/apikey",
    linkLabel: "Ouvrir Google AI Studio",
  },
  {
    name: "Groq",
    icon: <GroqIcon />,
    steps: [
      "Rendez-vous sur console.groq.com et connectez-vous.",
      "Cliquez sur « API Keys » dans le menu de gauche.",
      "Cliquez sur « Create API Key ».",
      "Copiez la clé générée (elle commence par « gsk_ »).",
      "Collez-la dans le champ ci-contre.",
    ],
    link: "https://console.groq.com/keys",
    linkLabel: "Ouvrir la console Groq",
  },
  {
    name: "Mistral AI",
    icon: <MistralIcon />,
    steps: [
      "Rendez-vous sur console.mistral.ai et connectez-vous.",
      "Cliquez sur « API Keys » dans le menu de gauche.",
      "Cliquez sur « Create new key ».",
      "Copiez la clé générée.",
      "Collez-la dans le champ ci-contre.",
    ],
    link: "https://console.mistral.ai/api-keys",
    linkLabel: "Ouvrir la console Mistral",
  },
  {
    name: "Perplexity",
    icon: <PerplexityIcon />,
    included: true,
    steps: [
      "Rendez-vous sur www.perplexity.ai et connectez-vous.",
      "Cliquez sur votre avatar, puis « Settings » → « API ».",
      "Cliquez sur « Generate API Key ».",
      "Copiez la clé générée (elle commence par « pplx- »).",
      "Collez-la dans le champ ci-contre.",
    ],
    link: "https://www.perplexity.ai/settings/api",
    linkLabel: "Ouvrir les paramètres Perplexity",
  },
  {
    name: "DeepSeek",
    icon: <DeepSeekIcon />,
    steps: [
      "Rendez-vous sur platform.deepseek.com et connectez-vous.",
      "Cliquez sur « API Keys » dans le menu de gauche.",
      "Cliquez sur « Create new API key ».",
      "Copiez la clé générée (elle commence par « sk- »).",
      "Collez-la dans le champ ci-contre.",
    ],
    link: "https://platform.deepseek.com/api_keys",
    linkLabel: "Ouvrir la plateforme DeepSeek",
  },
];

/* -------------------------------------------------------------------------- */
/*  Étapes                                                                    */
/* -------------------------------------------------------------------------- */

const steps = [
  {
    key: "role",
    title: "Quel est votre profil ?",
    subtitle: "On adapte le workspace à votre façon de travailler.",
  },
  {
    key: "icp",
    title: "À qui vendez-vous en priorité ?",
    subtitle: "Décrivez votre client idéal en quelques mots.",
  },
  {
    key: "channel",
    title: "Par quels canaux vos prospects vous répondent-ils ?",
    subtitle: "On calibre les séquences et le ton en conséquence.",
  },
  {
    key: "sector",
    title: "Dans quel secteur évoluez-vous ?",
    subtitle: "Pour mieux cibler vos prospects.",
  },
  {
    key: "goal",
    title: "Combien de nouveaux leads par mois ?",
    subtitle: "On ajuste les recommandations.",
  },
  {
    key: "tone",
    title: "Quel ton adopter avec vos prospects ?",
    subtitle: "L'agent s'alignera sur votre style naturel.",
  },
  {
    key: "value",
    title: "Quelle est votre proposition de valeur principale ?",
    subtitle: "En une phrase, qu'est-ce qui vous rend unique ?",
  },
  {
    key: "objections",
    title: "Quelles objections rencontrez-vous le plus souvent ?",
    subtitle: "L'agent préparera des réponses adaptées. (Optionnel)",
  },
  {
    key: "byok",
    title: "Connectez votre propre fournisseur d'IA",
    subtitle: "Optionnel. L'IA intégrée fonctionne par défaut.",
  },
  { key: "ready", title: "Prêt à décoller.", subtitle: "L'agent a tout ce qu'il lui faut." },
];

/* -------------------------------------------------------------------------- */
/*  Options de questions                                                      */
/* -------------------------------------------------------------------------- */

const roleOptions = ["Founder solo", "Petite équipe (2-5)", "Agence", "Autre"];
const channelOptions = ["Instagram", "LinkedIn", "WhatsApp", "Email", "Multi-canal", "Autre"];
const sectorOptions = ["Tech / IT", "Finance", "Santé", "Industrie", "Commerce", "Autre"];
const goalOptions = ["Moins de 10", "10-50", "50-200", "200+", "Autre"];
const toneOptions = ["Formel", "Décontracté", "Direct", "Consultatif", "Inspirant", "Autre"];

const otherRoleOptions = [
  "Consultant",
  "Freelance",
  "Scale-up",
  "Grande entreprise",
  "Association",
];
const otherChannelOptions = ["Téléphone", "Événement", "Webinaire", "Communauté", "Partenaire"];
const otherSectorOptions = [
  "Éducation",
  "Immobilier",
  "Transport",
  "Énergie",
  "Média",
  "Hôtellerie",
];
const otherGoalOptions = ["500+", "1000+", "Objectif qualitatif", "Pas encore défini"];
const otherToneOptions = [
  "Empathique",
  "Humoristique",
  "Autoritaire",
  "Pédagogique",
  "Minimaliste",
];

/* -------------------------------------------------------------------------- */
/*  Textarea auto-extensible                                                  */
/* -------------------------------------------------------------------------- */

function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  minHeight = 100,
  maxHeight = 400,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, minHeight), maxHeight)}px`;
  }, [value, minHeight, maxHeight]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-border bg-surface/40 px-4 md:px-5 py-3 md:py-4 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-none overflow-hidden"
      style={{ minHeight }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Coquille modale                                                           */
/* -------------------------------------------------------------------------- */

function ModalShell({
  children,
  onClose,
  maxWidth = "max-w-lg",
  labelledBy,
}: {
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        ref={ref}
        tabIndex={-1}
        className={`relative w-full ${maxWidth} rounded-2xl border border-border bg-background p-6 md:p-8 shadow-2xl animate-fade-in-up`}
      >
        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Guide fournisseur                                                         */
/* -------------------------------------------------------------------------- */

function GuideModal({ guide, onClose }: { guide: ProviderGuide; onClose: () => void }) {
  return (
    <ModalShell onClose={onClose} maxWidth="max-w-lg" labelledBy="guide-title">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-md p-1 text-muted-foreground hover:text-foreground"
        aria-label="Fermer"
      >
        <X className="size-5" />
      </button>
      <div className="flex items-center gap-3 mb-6">
        <div className="size-10 shrink-0 grid place-items-center rounded-lg border border-border bg-background text-foreground">
          {guide.icon}
        </div>
        <h3 id="guide-title" className="font-display text-xl md:text-2xl italic">
          Comment trouver votre clé {guide.name} ?
        </h3>
      </div>
      <ol className="space-y-3">
        {guide.steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-sm text-muted-foreground">
            <span className="shrink-0 size-6 rounded-full bg-primary/10 grid place-items-center text-xs font-medium text-primary">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex items-center justify-between">
        <a
          href={guide.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          {guide.linkLabel} <ExternalLink className="size-3.5" />
        </a>
        <button
          onClick={onClose}
          className="rounded-xl bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          J'ai compris
        </button>
      </div>
    </ModalShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  Modales de sortie                                                         */
/* -------------------------------------------------------------------------- */

function SkipConfirmModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalShell onClose={onCancel} maxWidth="max-w-md" labelledBy="skip-confirm-title">
      <button
        onClick={onCancel}
        className="absolute top-4 right-4 rounded-md p-1 text-muted-foreground hover:text-foreground"
        aria-label="Fermer"
      >
        <X className="size-5" />
      </button>

      <div className="flex items-start gap-4">
        <div className="shrink-0 size-11 rounded-full bg-amber-500/10 grid place-items-center">
          <AlertTriangle className="size-5 text-amber-500" />
        </div>
        <div className="min-w-0">
          <h3
            id="skip-confirm-title"
            className="font-display text-xl md:text-2xl italic leading-tight"
          >
            Passer le questionnaire ?
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Votre agent IA sera configuré avec les réglages par défaut. Votre expérience ne sera pas
            la même : moins de personnalisation, séquences génériques et résultats moins précis dès
            les premières utilisations.
          </p>

          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
              <span>
                Vous pourrez toujours compléter votre profil plus tard depuis les réglages.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
              <span>Environ 1 minute suffit pour terminer le questionnaire.</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <button
          onClick={onConfirm}
          className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-surface/50 transition-all"
        >
          Passer quand même
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl bg-foreground text-background px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Revenir au questionnaire
        </button>
      </div>
    </ModalShell>
  );
}

function SkipByokModal({
  onAddKey,
  onSkipAnyway,
  onBack,
}: {
  onAddKey: () => void;
  onSkipAnyway: () => void;
  onBack: () => void;
}) {
  return (
    <ModalShell onClose={onBack} maxWidth="max-w-lg" labelledBy="skip-byok-title">
      <button
        onClick={onBack}
        className="absolute top-4 right-4 rounded-md p-1 text-muted-foreground hover:text-foreground"
        aria-label="Fermer"
      >
        <X className="size-5" />
      </button>

      <div className="flex items-start gap-4">
        <div className="shrink-0 size-11 rounded-full bg-primary/10 grid place-items-center">
          <Sparkles className="size-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h3
            id="skip-byok-title"
            className="font-display text-xl md:text-2xl italic leading-tight"
          >
            Une dernière chose — votre clé API.
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            L'IA intégrée fonctionne, mais elle est limitée. En branchant votre propre fournisseur
            (Anthropic, OpenAI, Google…), vous débloquez :
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-2.5">
        {[
          "Aucune marge cachée — vous payez votre fournisseur au prix réel.",
          "Continuez bien au-delà des limites gratuites incluses.",
          "Chat illimité avec votre agent, sans plafond de tokens.",
        ].map((benefit) => (
          <li key={benefit} className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 shrink-0 size-5 rounded-full bg-emerald-500/10 grid place-items-center">
              <Check className="size-3 text-emerald-500" strokeWidth={3} />
            </span>
            <span className="text-foreground/90">{benefit}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 space-y-2">
        <button
          onClick={onAddKey}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-4 py-3 text-sm font-medium hover:opacity-90 transition-opacity group"
        >
          <Key className="size-4" />
          Ajouter ma clé API maintenant
          <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          onClick={onSkipAnyway}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-surface/50 transition-all"
        >
          <SkipForward className="size-4" />
          Passer quand même → workspace
        </button>

        <button
          onClick={onBack}
          className="w-full text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors pt-1"
        >
          Revenir au questionnaire
        </button>
      </div>

      <p className="mt-5 text-[11px] text-muted-foreground/70 text-center">
        Vous pourrez ajouter votre clé API à tout moment depuis les réglages du workspace.
      </p>
    </ModalShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  Placeholders de clés API                                                  */
/* -------------------------------------------------------------------------- */

const providerPlaceholders: Record<string, string> = {
  Anthropic: "sk-ant-...",
  OpenAI: "sk-...",
  "Google Gemini": "AIza...",
  Groq: "gsk_...",
  "Mistral AI": "Clé API...",
  Perplexity: "pplx-...",
  DeepSeek: "sk-...",
};

/* -------------------------------------------------------------------------- */
/*  Carte fournisseur                                                         */
/* -------------------------------------------------------------------------- */

function ProviderCard({
  provider,
  value,
  onChange,
  onOpenGuide,
}: {
  provider: ProviderGuide;
  value: string;
  onChange: (v: string) => void;
  onOpenGuide: (guide: ProviderGuide) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4 md:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 shrink-0 grid place-items-center rounded-lg border border-border bg-background text-foreground">
            {provider.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm md:text-base truncate">{provider.name}</span>
              {provider.included && (
                <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary uppercase tracking-wide">
                  Inclus
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onOpenGuide(provider)}
          className="text-xs text-primary hover:underline shrink-0"
        >
          Comment trouver votre clé ?
        </button>
      </div>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={providerPlaceholders[provider.name] ?? "Clé API..."}
        className="w-full rounded-xl border border-border bg-background px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-credentials-auto-fill-button]:hidden [&::-webkit-contacts-auto-fill-button]:hidden"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Grille d'options                                                          */
/* -------------------------------------------------------------------------- */

interface ChoiceQuestion {
  options: string[];
  selected: string | null;
  onSelect: (v: string) => void;
  otherTitle: string;
  otherOptions: string[];
  otherPlaceholder: string;
}

const optionBase =
  "w-full flex items-center justify-between gap-2 text-left p-3 md:p-4 rounded-xl border transition-all";
const optionOn = "border-primary bg-primary/5 ring-2 ring-primary/10";
const optionOff =
  "border-border bg-background/80 backdrop-blur-sm hover:border-foreground/20 hover:bg-surface/60";

function OptionGrid({ question }: { question: ChoiceQuestion }) {
  const { options, selected, onSelect } = question;
  const isOdd = options.length % 2 === 1;
  const isCustom = selected !== null && !options.includes(selected);

  return (
    <div className="grid grid-cols-2 gap-2 md:gap-3">
      {options.map((opt, i) => {
        const span = isOdd && i === options.length - 1 ? "col-span-2" : "";

        if (opt === "Autre") {
          return (
            <OtherOption
              key={opt}
              className={span}
              title={question.otherTitle}
              choices={question.otherOptions}
              placeholder={question.otherPlaceholder}
              selected={selected}
              isCustom={isCustom}
              onSelect={onSelect}
            />
          );
        }

        return (
          <div key={opt} className={span}>
            <button
              type="button"
              onClick={() => onSelect(opt)}
              className={`${optionBase} ${selected === opt ? optionOn : optionOff}`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <OptionIcon label={opt} active={selected === opt} />
                <span className="text-xs md:text-sm font-medium truncate">{opt}</span>
              </span>
              {selected === opt && <Check className="size-4 shrink-0 text-primary" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function OtherOption({
  className = "",
  title,
  choices,
  placeholder,
  selected,
  isCustom,
  onSelect,
}: {
  className?: string;
  title: string;
  choices: string[];
  placeholder: string;
  selected: string | null;
  isCustom: boolean;
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<{ v: "down" | "up"; h: "left" | "right" }>({
    v: "down",
    h: "left",
  });
  const [custom, setCustom] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open && wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect();
      const needed = Math.min(choices.length * 44, 176) + 120;
      const below = window.innerHeight - rect.bottom;
      const above = rect.top;
      setPlacement({
        v: below >= needed || below >= above ? "down" : "up",
        h: rect.left + rect.width / 2 > window.innerWidth / 2 ? "right" : "left",
      });
      setCustom(isCustom && selected && !choices.includes(selected) ? selected : "");
    }
    setOpen((o) => !o);
  };

  const choose = (v: string) => {
    onSelect(v);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${optionBase} ${isCustom ? optionOn : open ? "border-foreground/30 bg-surface/60 backdrop-blur-sm" : optionOff}`}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <OptionIcon label="Autre" active={isCustom} />
          <span className="text-xs md:text-sm font-medium truncate">
            {isCustom ? `Autre : ${selected}` : "Autre"}
          </span>
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={title}
          className={`absolute z-40 w-72 rounded-xl border border-border bg-background p-2 shadow-xl animate-fade-in-up ${
            placement.v === "down" ? "top-full mt-2" : "bottom-full mb-2"
          } ${placement.h === "right" ? "right-0" : "left-0"}`}
        >
          <p className="px-2 pt-1 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>

          <div className="max-h-44 overflow-y-auto space-y-1">
            {choices.map((c) => (
              <button
                key={c}
                type="button"
                role="option"
                aria-selected={selected === c}
                onClick={() => choose(c)}
                className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  selected === c ? "bg-primary/5 text-primary font-medium" : "hover:bg-surface/60"
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <OptionIcon label={c} active={selected === c} />
                  <span className="truncate">{c}</span>
                </span>
                {selected === c && <Check className="size-3.5 shrink-0" />}
              </button>
            ))}
          </div>

          <div className="mt-2 flex items-center gap-2 border-t border-border/60 pt-2">
            <input
              type="text"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && custom.trim()) choose(custom.trim());
              }}
              placeholder={placeholder}
              className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            />
            <button
              type="button"
              disabled={!custom.trim()}
              onClick={() => choose(custom.trim())}
              className="shrink-0 rounded-lg bg-foreground text-background px-3 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const [role, setRole] = useState<string | null>(null);
  const [icp, setIcp] = useState("");
  const [channel, setChannel] = useState<string | null>(null);
  const [sector, setSector] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [tone, setTone] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [objections, setObjections] = useState("");

  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showOtherProviders, setShowOtherProviders] = useState(false);
  const [guideModal, setGuideModal] = useState<ProviderGuide | null>(null);

  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [showSkipByok, setShowSkipByok] = useState(false);

  const isLast = step === steps.length - 1;
  const current = steps[step];
  const byokIndex = steps.findIndex((s) => s.key === "byok");
  const isChannelStep = current.key === "channel";

  const choiceQuestions: Record<string, ChoiceQuestion> = {
    role: {
      options: roleOptions,
      selected: role,
      onSelect: setRole,
      otherTitle: "Autres profils",
      otherOptions: otherRoleOptions,
      otherPlaceholder: "Précisez votre profil...",
    },
    channel: {
      options: channelOptions,
      selected: channel,
      onSelect: setChannel,
      otherTitle: "Autres canaux",
      otherOptions: otherChannelOptions,
      otherPlaceholder: "Précisez vos canaux...",
    },
    sector: {
      options: sectorOptions,
      selected: sector,
      onSelect: setSector,
      otherTitle: "Autres secteurs",
      otherOptions: otherSectorOptions,
      otherPlaceholder: "Précisez votre secteur...",
    },
    goal: {
      options: goalOptions,
      selected: goal,
      onSelect: setGoal,
      otherTitle: "Autres objectifs",
      otherOptions: otherGoalOptions,
      otherPlaceholder: "Précisez votre objectif...",
    },
    tone: {
      options: toneOptions,
      selected: tone,
      onSelect: setTone,
      otherTitle: "Autres tons",
      otherOptions: otherToneOptions,
      otherPlaceholder: "Précisez votre ton...",
    },
  };
  const choice = choiceQuestions[current.key];

  const getSelectedValue = (key: string) => choiceQuestions[key]?.selected ?? null;

  const isStepValid = () => {
    if (choice) return choice.selected !== null && choice.selected.trim() !== "";
    switch (current.key) {
      case "icp":
        return icp.trim() !== "";
      case "value":
        return value.trim() !== "";
      case "objections":
        return true;
      case "byok":
        return true;
      case "ready":
        return true;
      default:
        return false;
    }
  };

  const handleContinue = () => {
    if (isLast) navigate({ to: "/app" });
    else setStep(step + 1);
  };

  const canSkip = !["ready", "byok"].includes(current.key);
  const skipQuestion = () => {
    switch (current.key) {
      case "role":
        setRole(null);
        break;
      case "icp":
        setIcp("");
        break;
      case "channel":
        setChannel(null);
        break;
      case "sector":
        setSector(null);
        break;
      case "goal":
        setGoal(null);
        break;
      case "tone":
        setTone(null);
        break;
      case "value":
        setValue("");
        break;
      case "objections":
        setObjections("");
        break;
      default:
        break;
    }
    if (!isLast) setStep(step + 1);
  };

  const openGuide = (guide: ProviderGuide) => setGuideModal(guide);
  const setApiKey = (name: string, v: string) => setApiKeys((prev) => ({ ...prev, [name]: v }));

  const handleSkipQuestionnaire = () => setShowSkipConfirm(true);

  const confirmSkip = () => {
    setShowSkipConfirm(false);
    setShowSkipByok(true);
  };

  const goToByokStep = () => {
    setShowSkipByok(false);
    if (byokIndex >= 0) setStep(byokIndex);
  };

  const skipAnyway = () => {
    setShowSkipByok(false);
    navigate({ to: "/app" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {guideModal && <GuideModal guide={guideModal} onClose={() => setGuideModal(null)} />}
      {showSkipConfirm && (
        <SkipConfirmModal onCancel={() => setShowSkipConfirm(false)} onConfirm={confirmSkip} />
      )}
      {showSkipByok && (
        <SkipByokModal
          onAddKey={goToByokStep}
          onSkipAnyway={skipAnyway}
          onBack={() => {
            setShowSkipByok(false);
            setShowSkipConfirm(true);
          }}
        />
      )}

      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-2">
          <div className="min-w-0 shrink">
            <BrandLogo />
          </div>
          <div className="hidden sm:flex items-center gap-1.5 md:gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 w-6 md:w-8 rounded-full transition-colors ${i <= step ? "bg-foreground" : "bg-border"}`}
              />
            ))}
          </div>
          <button
            onClick={handleSkipQuestionnaire}
            className="shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-[11px] md:text-sm text-muted-foreground hover:text-foreground transition-colors"
            title="Passer tout le questionnaire"
          >
            Passer le questionnaire
          </button>
        </div>
        <div className="border-t border-border/40 bg-background/50">
          <div className="mx-auto max-w-3xl px-4 md:px-6 py-1.5 md:py-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] md:text-xs font-medium text-muted-foreground">
                Étape {step + 1} sur {steps.length}
              </span>
              <span className="text-[10px] md:text-xs text-muted-foreground/60">
                {Math.round(((step + 1) / steps.length) * 100)}% complété
              </span>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-border sm:hidden">
              <div
                className="h-full rounded-full bg-foreground transition-all duration-300"
                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center relative overflow-hidden">
        {isChannelStep && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 md:opacity-30 pointer-events-none"
              style={{ backgroundImage: "url('/images/catalogue-reseaux.webp')" }}
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background/80 pointer-events-none"
              aria-hidden="true"
            />
          </>
        )}

        <div className="w-full mx-auto max-w-2xl px-4 md:px-6 py-8 md:py-16 relative z-10">
          <div key={step} className="animate-fade-in-up">
            <h1 className="font-display text-2xl md:text-5xl italic leading-tight tracking-tight">
              {current.title}
            </h1>
            <p className="mt-1 md:mt-2 text-sm md:text-lg text-muted-foreground">
              {current.subtitle}
            </p>

            <div className="mt-6 md:mt-10">
              {choice && <OptionGrid question={choice} />}

              {current.key === "icp" && (
                <AutoResizeTextarea
                  value={icp}
                  onChange={setIcp}
                  placeholder="Ex. CTO d'entreprises industrielles françaises de 50 à 500 personnes qui recrutent des ingénieurs..."
                  minHeight={120}
                />
              )}

              {current.key === "value" && (
                <AutoResizeTextarea
                  value={value}
                  onChange={setValue}
                  placeholder="Ex. Nous aidons les équipes commerciales B2B à doubler leur taux de réponse grâce à des séquences hyper-personnalisées par IA."
                  minHeight={120}
                />
              )}

              {current.key === "objections" && (
                <AutoResizeTextarea
                  value={objections}
                  onChange={setObjections}
                  placeholder="Ex. « C'est trop cher », « On a déjà un outil », « Je n'ai pas le temps », « Comment garantissez-vous les résultats ? »"
                  minHeight={100}
                />
              )}

              {current.key === "byok" && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 md:p-5 flex gap-3">
                    <Info className="size-5 text-primary shrink-0 mt-0.5" />
                    <div className="text-sm md:text-base">
                      <p className="font-medium text-foreground">
                        Allez plus loin : grâce à votre propre fournisseur, bénéficiez de vos
                        consommations sans marge cachée et profitez d'un chat illimité.
                      </p>
                      <p className="mt-1 text-xs md:text-sm text-muted-foreground">
                        L'ajout d'une clé API personnelle n'est <strong>pas obligatoire</strong>.
                        Les modèles inclus (Claude, ChatGPT, Gemini, Perplexity) restent disponibles
                        sans aucune configuration.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Fournisseurs principaux
                    </h3>
                    {providerGuides.slice(0, 3).map((provider) => (
                      <ProviderCard
                        key={provider.name}
                        provider={provider}
                        value={apiKeys[provider.name] || ""}
                        onChange={(v) => setApiKey(provider.name, v)}
                        onOpenGuide={openGuide}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowOtherProviders(!showOtherProviders)}
                    className="w-full rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground hover:border-foreground/20 hover:text-foreground transition-all"
                  >
                    {showOtherProviders
                      ? "Masquer les autres fournisseurs"
                      : "Autres fournisseurs..."}
                  </button>

                  {showOtherProviders && (
                    <div className="space-y-3">
                      {providerGuides.slice(3).map((provider) => (
                        <ProviderCard
                          key={provider.name}
                          provider={provider}
                          value={apiKeys[provider.name] || ""}
                          onChange={(v) => setApiKey(provider.name, v)}
                          onOpenGuide={openGuide}
                        />
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    Vos clés sont chiffrées côté client. Nous ne les stockons jamais en clair.
                  </p>
                </div>
              )}

              {current.key === "ready" && (
                <div className="rounded-2xl border border-border bg-surface/40 p-6 md:p-8 text-center">
                  <div className="mx-auto size-10 md:size-14 rounded-full bg-primary/10 grid place-items-center">
                    <Check className="size-5 md:size-6 text-primary" strokeWidth={2} />
                  </div>
                  <h3 className="mt-4 md:mt-6 font-display text-2xl md:text-3xl italic">
                    L'agent est configuré.
                  </h3>
                  <p className="mt-1 md:mt-2 text-xs md:text-sm text-muted-foreground">
                    On vous emmène dans votre workspace.
                  </p>
                  <div className="mt-6 text-left text-sm text-muted-foreground space-y-2 max-w-md mx-auto">
                    <p>
                      <strong className="text-foreground">Profil :</strong>{" "}
                      {getSelectedValue("role") || "Non renseigné"}
                    </p>
                    <p>
                      <strong className="text-foreground">ICP :</strong> {icp || "Non renseigné"}
                    </p>
                    <p>
                      <strong className="text-foreground">Canaux :</strong>{" "}
                      {getSelectedValue("channel") || "Non renseigné"}
                    </p>
                    <p>
                      <strong className="text-foreground">Secteur :</strong>{" "}
                      {getSelectedValue("sector") || "Non renseigné"}
                    </p>
                    <p>
                      <strong className="text-foreground">Objectif :</strong>{" "}
                      {getSelectedValue("goal") || "Non renseigné"}
                    </p>
                    <p>
                      <strong className="text-foreground">Ton :</strong>{" "}
                      {getSelectedValue("tone") || "Non renseigné"}
                    </p>
                    <p>
                      <strong className="text-foreground">Proposition de valeur :</strong>{" "}
                      {value || "Non renseigné"}
                    </p>
                    <p>
                      <strong className="text-foreground">Objections :</strong>{" "}
                      {objections || "Non renseigné"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 md:mt-12 flex items-center justify-between gap-3">
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="inline-flex items-center gap-1.5 md:gap-2 rounded-xl px-2 py-2.5 md:py-3 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="size-4" /> Retour
              </button>

              <div className="flex items-center gap-2 md:gap-3">
                {canSkip && (
                  <button
                    onClick={skipQuestion}
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-4 md:px-5 py-2.5 md:py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-surface/50 transition-all"
                  >
                    <SkipForward className="size-4" />
                    <span>
                      Passer<span className="hidden sm:inline"> cette question</span>
                    </span>
                  </button>
                )}
                <button
                  onClick={handleContinue}
                  disabled={!isStepValid()}
                  className="group inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-4 md:px-5 py-2.5 md:py-3 text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isLast ? "Entrer dans le workspace" : "Continuer"}
                  <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{ title: "Bienvenue — LeadCortex" }, { name: "robots", content: "noindex" }],
  }),
  pendingComponent: () => <OnboardingSkeleton />,
  component: OnboardingPage,
});
