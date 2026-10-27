import React from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Coffee,
  Compass,
  Map,
  MapPin,
  Mountain,
  Plane,
  Sparkles,
  Wallet,
} from "lucide-react";
import { photo } from "../data.js";

export function Landing({ onDemo, onAuth }) {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="brand">
          <span className="brand-icon">
            <Compass size={24} />
          </span>
          roam<span className="brand-period">.</span>
        </div>
        <div>
          <button className="text-button" onClick={() => onAuth("login")}>
            Sign in
          </button>
          <button className="button primary" onClick={() => onAuth("register")}>
            Start your story <ArrowUpRight size={17} />
          </button>
        </div>
      </header>
      <div className="landing-main">
        <div className="landing-copy">
          <div className="eyebrow">
            <span className="tiny-star">✳</span> FOR THE WAY YOU WANDER
          </div>
          <h1>
            A little planning.
            <br />A lot of <em>possibility.</em>
          </h1>
          <p>
            Your trips, your memories, your own little corner of the world.
            Bring every adventure together in one beautiful place.
          </p>
          <div className="landing-actions">
            <button
              className="button primary"
              onClick={() => onAuth("register")}
            >
              Make room for adventure <ArrowUpRight size={18} />
            </button>
            <button className="button secondary" onClick={onDemo}>
              Explore the demo <ArrowRight size={17} />
            </button>
          </div>
          <div className="landing-note">
            <span className="overlap-icons">
              <span>
                <Mountain size={16} />
              </span>
              <span>
                <Coffee size={16} />
              </span>
              <span>
                <Plane size={16} />
              </span>
            </span>
            <span>
              For big dreams and small escapes.
              <br />
              <strong>No perfect plan required.</strong>
            </span>
          </div>
        </div>
        <div className="landing-art">
          <img
            src={photo("bali", 1200)}
            alt="Lakeside temple surrounded by mountains in Bali"
          />
          <div className="photo-label">
            <MapPin size={16} /> Ubud, Bali <span>8.5069° S, 115.2625° E</span>
          </div>
          <div className="floating-note">
            <Compass size={30} />
            <div>
              Take the scenic route.
              <span>There’s a story waiting for you.</span>
            </div>
          </div>
          <span className="landing-circle">
            GO SOMEWHERE
            <br />
            <Sparkles size={22} />
            <br />
            FEEL SOMETHING
          </span>
        </div>
      </div>
      <div className="landing-features">
        {[
          [Map, "A home for every journey", "Dream it. Plan it. Go live it."],
          [Wallet, "Keep your budget in view", "Spend on moments that matter."],
          [
            BookOpen,
            "Hold on to the little things",
            "Turn passing moments into keepsakes.",
          ],
        ].map(([Icon, title, text]) => (
          <div key={title}>
            <Icon size={23} />
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </div>
        ))}
      </div>
      <footer className="landing-footer">
        <span>roam. A personal travel companion.</span>
        <span>MongoDB · Express · React · Node.js</span>
      </footer>
    </div>
  );
}
