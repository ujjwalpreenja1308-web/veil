"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { CheckCheck, Zap, BarChart3, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const plans = [
  {
    name: "Starter",
    description: "For solo developers and small teams shipping their first AI agents.",
    price: 29,
    yearlyPrice: 249,
    buttonText: "Get started",
    buttonVariant: "outline" as const,
    features: [
      { text: "Up to 3 agents", icon: <Zap size={16} /> },
      { text: "50k events / month", icon: <BarChart3 size={16} /> },
      { text: "7-day trace retention", icon: <ShieldCheck size={16} /> },
    ],
    includes: [
      "Starter includes:",
      "Live execution traces",
      "10 failure categories",
      "Email alerts",
    ],
  },
  {
    name: "Pro",
    description: "For teams running agents in production who need deep visibility.",
    price: 79,
    yearlyPrice: 699,
    buttonText: "Get started",
    buttonVariant: "outline" as const,
    features: [
      { text: "Unlimited agents", icon: <Zap size={16} /> },
      { text: "500k events / month", icon: <BarChart3 size={16} /> },
      { text: "30-day trace retention", icon: <ShieldCheck size={16} /> },
    ],
    includes: [
      "Everything in Starter, plus:",
      "Slack and email alerts",
      "Cost per run breakdown",
      "Pattern detection",
    ],
  },
  {
    name: "Enterprise",
    description: "Custom scale, SLA, and compliance for AI-native organizations.",
    price: 299,
    yearlyPrice: 2499,
    popular: true,
    buttonText: "Talk to us",
    buttonVariant: "default" as const,
    features: [
      { text: "Unlimited everything", icon: <Zap size={16} /> },
      { text: "Custom event volume", icon: <BarChart3 size={16} /> },
      { text: "90-day trace retention", icon: <ShieldCheck size={16} /> },
    ],
    includes: [
      "Everything in Pro, plus:",
      "SSO and audit logs",
      "Dedicated support",
      "Custom SLA",
    ],
  },
];

const PricingSwitch = ({
  onSwitch,
  className,
}: {
  onSwitch: (value: string) => void;
  className?: string;
}) => {
  const [selected, setSelected] = useState("0");

  const handleSwitch = (value: string) => {
    setSelected(value);
    onSwitch(value);
  };

  return (
    <div className={cn("flex justify-center", className)}>
      <div className="relative z-10 mx-auto flex w-fit rounded-full bg-white/[0.05] border border-white/[0.08] p-1">
        <button
          onClick={() => handleSwitch("0")}
          className={cn(
            "relative z-10 w-fit h-9 cursor-pointer rounded-full px-5 text-[13px] font-medium transition-colors",
            selected === "0" ? "text-white" : "text-white/40 hover:text-white/70"
          )}
        >
          {selected === "0" && (
            <motion.span
              layoutId="switch"
              className="absolute top-0 left-0 h-full w-full rounded-full bg-white/[0.10] border border-white/[0.12]"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative">Monthly</span>
        </button>

        <button
          onClick={() => handleSwitch("1")}
          className={cn(
            "relative z-10 w-fit h-9 cursor-pointer rounded-full px-5 text-[13px] font-medium transition-colors flex items-center gap-2",
            selected === "1" ? "text-white" : "text-white/40 hover:text-white/70"
          )}
        >
          {selected === "1" && (
            <motion.span
              layoutId="switch"
              className="absolute top-0 left-0 h-full w-full rounded-full bg-white/[0.10] border border-white/[0.12]"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative flex items-center gap-2">
            Yearly
            <span className="rounded-full bg-blue-500/20 border border-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
              Save 20%
            </span>
          </span>
        </button>
      </div>
    </div>
  );
};

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay },
  },
});

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  const togglePricingPeriod = (value: string) =>
    setIsYearly(Number.parseInt(value) === 1);

  return (
    <section className="relative py-28 border-t border-white/[0.05]" id="pricing">
      <div className="max-w-5xl mx-auto px-6">

        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-14"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.div variants={fadeUp(0)}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30 mb-5">
              Pricing
            </p>
            <h2
              className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold tracking-[-0.03em] leading-[1.08] text-white max-w-xs"
              style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
            >
              <VerticalCutReveal
                splitBy="words"
                staggerDuration={0.12}
                staggerFrom="first"
                containerClassName="flex-wrap"
                transition={{ type: "spring", stiffness: 250, damping: 40 }}
              >
                Simple, transparent pricing
              </VerticalCutReveal>
            </h2>
          </motion.div>

          <motion.div variants={fadeUp(0.1)}>
            <PricingSwitch onSwitch={togglePricingPeriod} />
          </motion.div>
        </motion.div>

        {/* Cards */}
        <motion.div
          className="grid md:grid-cols-3 gap-px bg-white/[0.06]"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {plans.map((plan) => (
            <motion.div key={plan.name} variants={fadeUp(0)}>
              <Card
                className={cn(
                  "relative flex flex-col justify-between h-full rounded-none border-0",
                  plan.popular
                    ? "bg-[#0d1220] ring-1 ring-blue-500/30"
                    : "bg-[#080810]"
                )}
              >
                {plan.popular && (
                  <div className="absolute top-5 right-5">
                    <span className="bg-blue-500/15 border border-blue-500/25 text-blue-400 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase">
                      Most popular
                    </span>
                  </div>
                )}

                <CardContent className="pt-8 pb-0 px-7">
                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-[2.6rem] font-bold text-white tabular-nums tracking-tight leading-none">
                      $<NumberFlow
                        value={isYearly ? plan.yearlyPrice : plan.price}
                        className="text-[2.6rem] font-bold text-white"
                      />
                    </span>
                    <span className="text-[13px] text-white/30 ml-1">
                      /{isYearly ? "yr" : "mo"}
                    </span>
                  </div>

                  {/* Name + desc */}
                  <h3
                    className="text-[18px] font-semibold text-white/90 mb-2 mt-4"
                    style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
                  >
                    {plan.name}
                  </h3>
                  <p className="text-[12px] text-white/35 leading-relaxed mb-6">
                    {plan.description}
                  </p>

                  {/* Includes */}
                  <div className="border-t border-white/[0.07] pt-5">
                    <p className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.16em] mb-4">
                      {plan.includes[0]}
                    </p>
                    <ul className="flex flex-col gap-2.5">
                      {plan.includes.slice(1).map((feature, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <span className="h-5 w-5 rounded-full border border-white/[0.12] bg-white/[0.05] grid place-content-center flex-shrink-0">
                            <CheckCheck className="h-3 w-3 text-blue-400/80" />
                          </span>
                          <span className="text-[13px] text-white/60">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>

                <CardFooter className="px-7 pt-6 pb-7">
                  <button
                    className={cn(
                      "w-full py-3 rounded-xl text-[14px] font-semibold transition-all duration-200 active:scale-[0.97]",
                      plan.popular
                        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                        : "bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.10] text-white/80"
                    )}
                  >
                    {plan.buttonText}
                  </button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center text-[12px] text-white/20 mt-8"
        >
          All plans include a 14-day free trial. No credit card required.
        </motion.p>

      </div>
    </section>
  );
}
