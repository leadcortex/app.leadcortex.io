// frontend/routes/onboarding.tsx

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
} from "@/components/icons";
import { BrandLogo } from "@/components/brand/brand-logo";
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

interface ProviderGuide {
  name: string;
  icon: React.ReactNode;
  steps: string[];
  link: string;
  linkLabel: string;
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

const steps = [
  {
    key: "role",
    title: "Quel est votre profil ?",
    subtitle: "Le workspace s’adapte à votre façon de travailler.",
  },
  {
    key: "icp",
    title: "À qui vendez-vous en priorité ?",
    subtitle: "Décrivez votre client idéal en quelques mots.",
  },
  {
    key: "channel",
    title: "Où vos prospects vous répondent-ils ?",
    subtitle: "Les séquences et le ton en dépendent.",
  },
  {
    key: "sector",
    title: "Dans quel secteur travaillez-vous ?",
    subtitle: "",
  },
  {
    key: "goal",
    title: "Combien de nouveaux leads par mois ?",
    subtitle: "",
  },
  {
    key: "tone",
    title: "Quel ton prendre avec vos prospects ?",
    subtitle: "L’agent écrira dans ce style.",
  },
  {
    key: "value",
    title: "Qu’est-ce qui vous distingue ?",
    subtitle: "Votre proposition de valeur, en une phrase.",
  },
  {
    key: "objections",
    title: "Quelles objections entendez-vous le plus ?",
    subtitle: "Facultatif. L’agent préparera des réponses.",
  },
  {
    key: "byok",
    title: "Votre propre fournisseur d’IA",
    subtitle: "Facultatif. L’IA intégrée fonctionne sans configuration.",
  },
  { key: "ready", title: "C’est prêt.", subtitle: "Voici ce que l’agent sait de vous." },
];

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
      className="w-full resize-none overflow-hidden rounded-xl border border-input bg-background px-4 py-3 text-base placeholder:text-muted-foreground transition-[border-color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
      style={{ minHeight }}
    />
  );
}

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
        className={`relative w-full ${maxWidth} rounded-3xl border border-border bg-background p-6 md:p-8 shadow-float animate-fade-in-up focus:outline-none`}
      >
        {children}
      </div>
    </div>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-4 top-4 grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-surface/70 hover:text-foreground"
      aria-label="Fermer"
    >
      <X className="size-4" />
    </button>
  );
}

const primaryButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-colors duration-150 ease-out hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40 md:h-10";
const outlineButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors duration-150 ease-out hover:bg-surface/70 md:h-10";
const ghostButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors duration-150 ease-out hover:bg-surface/70 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 md:h-10";

function GuideModal({ guide, onClose }: { guide: ProviderGuide; onClose: () => void }) {
  return (
    <ModalShell onClose={onClose} maxWidth="max-w-lg" labelledBy="guide-title">
      <CloseButton onClick={onClose} />
      <div className="mb-6 flex items-center gap-3 pr-10">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-background text-foreground">
          {guide.icon}
        </div>
        <h3 id="guide-title" className="text-base font-semibold">
          Trouver votre clé {guide.name}
        </h3>
      </div>
      <ol className="space-y-3">
        {guide.steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <span className="w-4 shrink-0 text-right tabular-nums text-muted-foreground">
              {i + 1}.
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <a
          href={guide.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1 text-sm text-primary hover:underline"
        >
          {guide.linkLabel} <ExternalLink className="size-3.5" />
        </a>
        <button type="button" onClick={onClose} className={primaryButton}>
          J’ai compris
        </button>
      </div>
    </ModalShell>
  );
}

function SkipConfirmModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalShell onClose={onCancel} maxWidth="max-w-md" labelledBy="skip-confirm-title">
      <CloseButton onClick={onCancel} />
      <h3 id="skip-confirm-title" className="pr-10 text-base font-semibold">
        Passer le questionnaire ?
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        L’agent partira des réglages par défaut : séquences plus génériques, résultats moins précis
        au début. Le questionnaire prend environ 1 minute, et vous pourrez le compléter plus tard
        dans les réglages.
      </p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onConfirm} className={outlineButton}>
          Passer quand même
        </button>
        <button type="button" onClick={onCancel} className={primaryButton}>
          Continuer le questionnaire
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
    <ModalShell onClose={onBack} maxWidth="max-w-md" labelledBy="skip-byok-title">
      <CloseButton onClick={onBack} />
      <h3 id="skip-byok-title" className="pr-10 text-base font-semibold">
        Ajouter votre clé API ?
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        L’IA intégrée fonctionne, avec des limites. Avec votre propre fournisseur (Anthropic,
        OpenAI, Google…) :
      </p>
      <ul className="mt-4 space-y-2 text-sm">
        {[
          "vous payez le fournisseur au prix réel, sans marge ;",
          "vous dépassez les limites gratuites ;",
          "le chat avec l’agent n’a plus de plafond de tokens.",
        ].map((benefit) => (
          <li key={benefit} className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">
        Vous pourrez l’ajouter plus tard dans les réglages du workspace.
      </p>

      <div className="mt-6 grid gap-2">
        <button type="button" onClick={onAddKey} className={primaryButton}>
          Ajouter ma clé API
        </button>
        <button type="button" onClick={onSkipAnyway} className={outlineButton}>
          Aller au workspace sans clé
        </button>
        <button type="button" onClick={onBack} className={ghostButton}>
          Revenir au questionnaire
        </button>
      </div>
    </ModalShell>
  );
}

const providerPlaceholders: Record<string, string> = {
  Anthropic: "sk-ant-...",
  OpenAI: "sk-...",
  "Google Gemini": "AIza...",
  Groq: "gsk_...",
  "Mistral AI": "Clé API",
  Perplexity: "pplx-...",
  DeepSeek: "sk-...",
};

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
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 shrink-0 grid place-items-center rounded-lg border border-border bg-background text-foreground">
            {provider.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">{provider.name}</span>
              {provider.included && (
                <span className="shrink-0 text-xs text-muted-foreground">Inclus</span>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onOpenGuide(provider)}
          className="shrink-0 text-[13px] text-primary hover:underline"
        >
          Où la trouver ?
        </button>
      </div>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={providerPlaceholders[provider.name] ?? "Clé API"}
        aria-label={`Clé API ${provider.name}`}
        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base placeholder:text-muted-foreground transition-[border-color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 md:h-10 md:text-sm [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-credentials-auto-fill-button]:hidden [&::-webkit-contacts-auto-fill-button]:hidden"
      />
    </div>
  );
}

interface ChoiceQuestion {
  options: string[];
  selected: string | null;
  onSelect: (v: string) => void;
  otherTitle: string;
  otherOptions: string[];
  otherPlaceholder: string;
}

const optionBase =
  "flex h-12 w-full items-center justify-between gap-2 rounded-xl border px-4 text-left transition-colors duration-150 ease-out";
const optionOn = "border-primary bg-primary/5";
const optionOff = "border-border bg-background hover:bg-surface/70";

function OptionGrid({ question }: { question: ChoiceQuestion }) {
  const { options, selected, onSelect } = question;
  const isOdd = options.length % 2 === 1;
  const isCustom = selected !== null && !options.includes(selected);

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-3">
      {options.map((opt, i) => {
        const span = isOdd && i === options.length - 1 ? "sm:col-span-2" : "";

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
              <span className="flex min-w-0 items-center gap-3">
                <OptionIcon label={opt} active={selected === opt} />
                <span className="truncate text-sm font-medium">{opt}</span>
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
        className={`${optionBase} ${isCustom ? optionOn : open ? "border-foreground/30 bg-surface/70" : optionOff}`}
      >
        <span className="flex min-w-0 items-center gap-3">
          <OptionIcon label="Autre" active={isCustom} />
          <span className="truncate text-sm font-medium">
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
          className={`absolute z-40 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-background p-2 shadow-float animate-fade-in ${
            placement.v === "down" ? "top-full mt-2" : "bottom-full mb-2"
          } ${placement.h === "right" ? "right-0" : "left-0"}`}
        >
          <p className="px-2 pb-2 pt-1 text-xs font-medium text-muted-foreground">{title}</p>

          <div className="max-h-44 overflow-y-auto space-y-1">
            {choices.map((c) => (
              <button
                key={c}
                type="button"
                role="option"
                aria-selected={selected === c}
                onClick={() => choose(c)}
                className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg px-3 text-left text-sm transition-colors ${
                  selected === c ? "bg-primary/5 font-medium text-primary" : "hover:bg-surface/70"
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
              className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 md:h-9 md:text-sm"
            />
            <button
              type="button"
              disabled={!custom.trim()}
              onClick={() => choose(custom.trim())}
              className="h-10 shrink-0 rounded-lg bg-foreground px-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40 md:h-9"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
      otherPlaceholder: "Votre profil…",
    },
    channel: {
      options: channelOptions,
      selected: channel,
      onSelect: setChannel,
      otherTitle: "Autres canaux",
      otherOptions: otherChannelOptions,
      otherPlaceholder: "Vos canaux…",
    },
    sector: {
      options: sectorOptions,
      selected: sector,
      onSelect: setSector,
      otherTitle: "Autres secteurs",
      otherOptions: otherSectorOptions,
      otherPlaceholder: "Votre secteur…",
    },
    goal: {
      options: goalOptions,
      selected: goal,
      onSelect: setGoal,
      otherTitle: "Autres objectifs",
      otherOptions: otherGoalOptions,
      otherPlaceholder: "Votre objectif…",
    },
    tone: {
      options: toneOptions,
      selected: tone,
      onSelect: setTone,
      otherTitle: "Autres tons",
      otherOptions: otherToneOptions,
      otherPlaceholder: "Votre ton…",
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
    <div className="flex min-h-screen flex-col bg-background">
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

      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="min-w-0 shrink">
            <BrandLogo />
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs tabular-nums text-muted-foreground sm:inline">
              Étape {step + 1} sur {steps.length}
            </span>
            <button
              type="button"
              onClick={handleSkipQuestionnaire}
              className="h-9 shrink-0 whitespace-nowrap rounded-lg px-3 text-[13px] text-muted-foreground transition-colors hover:bg-surface/70 hover:text-foreground"
            >
              Passer le questionnaire
            </button>
          </div>
        </div>
        <div
          className="h-0.5 w-full bg-border"
          role="progressbar"
          aria-label={`Étape ${step + 1} sur ${steps.length}`}
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={step + 1}
        >
          <div
            className="h-full bg-foreground transition-[width] duration-200 ease-out"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </header>

      <main className="relative flex flex-1 items-start overflow-hidden md:items-center">
        {isChannelStep && (
          <>
            <div
              className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 md:opacity-30"
              style={{ backgroundImage: "url('/images/app/networks.webp')" }}
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background/80"
              aria-hidden="true"
            />
          </>
        )}

        <div className="relative z-10 mx-auto w-full max-w-2xl px-4 py-8 md:px-6 md:py-16">
          <div key={step} className="animate-fade-in">
            <p className="text-xs tabular-nums text-muted-foreground sm:hidden">
              Étape {step + 1} sur {steps.length}
            </p>
            <h1 className="mt-2 font-display text-3xl italic leading-tight tracking-tight sm:mt-0 md:text-5xl">
              {current.title}
            </h1>
            {current.subtitle && (
              <p className="mt-2 text-sm text-muted-foreground md:text-base">{current.subtitle}</p>
            )}

            <div className="mt-8">
              {choice && <OptionGrid question={choice} />}

              {current.key === "icp" && (
                <AutoResizeTextarea
                  value={icp}
                  onChange={setIcp}
                  placeholder="Ex. CTO d’entreprises industrielles françaises de 50 à 500 personnes qui recrutent des ingénieurs"
                  minHeight={120}
                />
              )}

              {current.key === "value" && (
                <AutoResizeTextarea
                  value={value}
                  onChange={setValue}
                  placeholder="Ex. Nous aidons les équipes commerciales B2B à obtenir plus de réponses avec des séquences personnalisées."
                  minHeight={120}
                />
              )}

              {current.key === "objections" && (
                <AutoResizeTextarea
                  value={objections}
                  onChange={setObjections}
                  placeholder="Ex. « C’est trop cher », « On a déjà un outil », « Je n’ai pas le temps »"
                  minHeight={100}
                />
              )}

              {current.key === "byok" && (
                <div className="space-y-6">
                  <p className="max-w-prose text-sm text-muted-foreground">
                    Les modèles inclus (Claude, ChatGPT, Gemini, Perplexity) marchent sans clé. Avec
                    la vôtre, vous payez le fournisseur au prix réel et le chat n’a plus de limite.
                  </p>

                  <div className="space-y-2">
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

                  {showOtherProviders && (
                    <div className="space-y-2">
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

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setShowOtherProviders(!showOtherProviders)}
                      aria-expanded={showOtherProviders}
                      className="inline-flex items-center gap-1 self-start text-[13px] font-medium text-foreground hover:text-primary"
                    >
                      {showOtherProviders ? "Moins de fournisseurs" : "Autres fournisseurs"}
                      <ChevronDown
                        className={`size-4 transition-transform ${showOtherProviders ? "rotate-180" : ""}`}
                      />
                    </button>
                    <p className="text-xs text-muted-foreground">
                      Clés chiffrées côté client, jamais stockées en clair.
                    </p>
                  </div>
                </div>
              )}

              {current.key === "ready" && (
                <dl className="divide-y divide-border rounded-xl border border-border bg-background">
                  {(
                    [
                      ["Profil", getSelectedValue("role")],
                      ["Client idéal", icp],
                      ["Canaux", getSelectedValue("channel")],
                      ["Secteur", getSelectedValue("sector")],
                      ["Objectif", getSelectedValue("goal")],
                      ["Ton", getSelectedValue("tone")],
                      ["Proposition de valeur", value],
                      ["Objections", objections],
                    ] as [string, string | null][]
                  ).map(([label, answer]) => (
                    <div
                      key={label}
                      className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[10rem_1fr] sm:gap-4"
                    >
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className={answer ? "text-foreground" : "text-muted-foreground"}>
                        {answer || "Non renseigné"}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between gap-2 md:mt-12">
              <button
                type="button"
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className={ghostButton}
              >
                <ArrowLeft className="size-4" />
                <span className="sr-only sm:not-sr-only">Retour</span>
              </button>

              <div className="flex items-center gap-2">
                {canSkip && (
                  <button type="button" onClick={skipQuestion} className={ghostButton}>
                    Passer
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!isStepValid()}
                  className={primaryButton}
                >
                  {isLast ? "Ouvrir le workspace" : "Continuer"}
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
    meta: [{ title: "Bienvenue · LeadCortex" }, { name: "robots", content: "noindex" }],
  }),
  pendingComponent: () => <OnboardingSkeleton />,
  component: OnboardingPage,
});
