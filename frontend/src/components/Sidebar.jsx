import React from "react";
import {
  CarIcon,
  SparklesIcon,
  PlusIcon,
  HelpCircleIcon,
  ArrowRightIcon
} from "./Icons.jsx";

const QUICK_PROMPTS = [
  "What vehicle models do you offer?",
  "Show me pricing, variants & EMI options.",
  "Which models feature electric or hybrid engines?",
  "Tell me about safety features and warranty.",
];

export default function Sidebar({
  onNewChat,
  onOpenLeadModal,
  onSendPrompt,
}) {
  return (
    <aside className="sidebar glass">
      {/* Brand Header */}
      <div className="brand">
        <div className="brand-logo">
          <CarIcon size={24} className="brand-car-ico" />
        </div>
        <div className="brand-text">
          <strong>SGA MOTORS</strong>
          <span>Sales Advisor</span>
        </div>
        <button className="icon-btn" title="Start New Chat" onClick={onNewChat}>
          <PlusIcon size={16} />
        </button>
      </div>

      {/* Customer Quick Actions & Test Drive CTA */}
      <div className="sidebar-cta-card">
        <div className="sidebar-cta-title">
          <SparklesIcon size={18} className="icon-accent" />
          <span>Vehicle Experience</span>
        </div>
        <p className="sidebar-cta-desc">
          Ready to experience your dream car? Schedule a personalized test drive or request instant pricing details.
        </p>
        <button
          className="btn btn-primary btn-block lead-trigger-btn"
          onClick={() => onOpenLeadModal?.()}
        >
          <CarIcon size={16} />
          <span>Book Test Drive / Callback</span>
        </button>
      </div>

      {/* Quick Discovery Prompts for Buyer */}
      <div className="sidebar-prompts-section">
        <div className="section-label">
          <HelpCircleIcon size={14} />
          <span>Popular Questions</span>
        </div>
        <div className="prompts-list">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              className="prompt-chip"
              onClick={() => onSendPrompt?.(prompt)}
            >
              <span>{prompt}</span>
              <ArrowRightIcon size={13} className="prompt-arrow" />
            </button>
          ))}
        </div>
      </div>

      {/* Customer Sidebar Footer */}
      <div className="sidebar-foot">
        <span className="foot-dot" />
        <span>SGA Motors AI Sales Experience · 2026</span>
      </div>
    </aside>
  );
}
