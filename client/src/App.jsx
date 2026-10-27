import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  Compass,
  Download,
  Globe2,
  LayoutDashboard,
  LogOut,
  Map,
  MapPin,
  Menu,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import {
  photo,
  uid,
  dateLabel,
  sampleTrips,
  tripPayload,
  request,
} from "./data.js";
import { planningErrors, planReadiness } from "../../shared/planning.js";
import { buildCalendar } from "../../shared/calendar.js";
import { Stat, TripCard, Empty, Modal } from "./components/ui.jsx";
import { Landing } from "./components/Landing.jsx";
import { AuthForm, TripForm, ItemForm } from "./components/forms.jsx";
import { TripDetail } from "./components/TripDetail.jsx";
import { Journal, Budgets } from "./components/collections.jsx";
const DEMO_KEY = "roam_demo_v1";
const SESSION_KEY = "roam_demo_active";

export default function App() {
  const [user, setUser] = useState(null),
    [demo, setDemo] = useState(false),
    [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true),
    [view, setView] = useState("Overview"),
    [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("All trips"),
    [search, setSearch] = useState(""),
    [mobileNav, setMobileNav] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const data = await request("/auth/me");
        const result = await request("/trips");
        setUser(data.user);
        setTrips(result.trips);
      } catch {
        if (sessionStorage.getItem(SESSION_KEY)) enterDemo();
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [view, selected]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  function enterDemo() {
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(DEMO_KEY));
    } catch {}
    const initial =
      Array.isArray(saved) &&
      saved.every(
        (t) =>
          t.id &&
          Array.isArray(t.expenses) &&
          Array.isArray(t.itinerary) &&
          Array.isArray(t.entries),
      )
        ? saved
        : sampleTrips();
    setTrips(initial);
    setDemo(true);
    setUser({ name: "Fellow explorer", email: "Browser-local demo" });
    sessionStorage.setItem(SESSION_KEY, "1");
    setModal(null);
  }
  function localSave(next) {
    localStorage.setItem(DEMO_KEY, JSON.stringify(next));
    setTrips(next);
  }
  async function saveTrip(trip, isNew = false) {
    const issues = planningErrors(trip);
    if (issues.length) throw new Error(issues[0]);
    if (trip.planStatus === "Ready" && !planReadiness(trip).ready)
      throw new Error(
        "Complete the readiness checklist, or move the plan back to draft before making this change.",
      );
    setBusy(true);
    try {
      if (demo) {
        const record = { ...trip, id: isNew ? uid() : trip.id };
        localSave(
          isNew
            ? [record, ...trips]
            : trips.map((t) => (t.id === record.id ? record : t)),
        );
        if (!isNew) setSelected(record.id);
      } else {
        const { trip: record } = await request(
          isNew ? "/trips" : `/trips/${trip.id}`,
          {
            method: isNew ? "POST" : "PUT",
            body: JSON.stringify(tripPayload(trip)),
          },
        );
        setTrips(
          isNew
            ? [record, ...trips]
            : trips.map((t) => (t.id === record.id ? record : t)),
        );
      }
      setModal(null);
      setToast(
        isNew
          ? "Your next adventure starts here."
          : "Saved. Back to the good stuff.",
      );
      return true;
    } catch (e) {
      throw e;
    } finally {
      setBusy(false);
    }
  }
  async function deleteTrip(trip) {
    setBusy(true);
    try {
      if (demo) localSave(trips.filter((t) => t.id !== trip.id));
      else {
        await request(`/trips/${trip.id}`, { method: "DELETE", body: "{}" });
        setTrips(trips.filter((t) => t.id !== trip.id));
      }
      setSelected(null);
      setModal(null);
      setToast("Trip deleted.");
    } catch (e) {
      setToast(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    try {
      if (!demo) await request("/auth/logout", { method: "POST", body: "{}" });
      sessionStorage.removeItem(SESSION_KEY);
      setDemo(false);
      setUser(null);
      setTrips([]);
      setSelected(null);
      setView("Overview");
    } catch (e) {
      setToast(e.message);
    }
  }
  async function onAuth(data) {
    sessionStorage.removeItem(SESSION_KEY);
    setDemo(false);
    setUser(data.user);
    const result = await request("/trips");
    setTrips(result.trips);
    setModal(null);
    setSelected(null);
  }
  function go(next) {
    setView(next);
    setSelected(null);
    setSearch("");
    setMobileNav(false);
  }
  function exportTrips() {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            { exportedAt: new Date().toISOString(), trips },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "roam-travel-journal.json";
    link.click();
    URL.revokeObjectURL(url);
    setToast("Your travel journal is ready to download.");
  }
  async function exportCalendar(trip) {
    try {
      let calendar;
      if (demo) calendar = buildCalendar(trip);
      else {
        const response = await fetch(`/api/trips/${trip.id}/calendar`, {
          credentials: "same-origin",
        });
        if (!response.ok) {
          const body = await response.json();
          throw new Error(body.error);
        }
        calendar = await response.text();
      }
      const url = URL.createObjectURL(
        new Blob([calendar], { type: "text/calendar;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "roam-itinerary.ics";
      link.click();
      URL.revokeObjectURL(url);
      setToast(
        "Calendar exported. Import it using your calendar’s local time zone.",
      );
    } catch (error) {
      setToast(error.message);
    }
  }
  const current = trips.find((t) => t.id === selected);
  const filtered = trips.filter(
    (t) =>
      (filter === "All trips" || t.status === filter) &&
      `${t.title} ${t.destination} ${t.country}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const upcoming = [...trips]
    .filter((t) => t.status !== "Completed")
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  const navItems = [
    [LayoutDashboard, "Overview"],
    [Map, "My trips"],
    [BookOpen, "Travel journal"],
    [Wallet, "Budgets"],
  ];
  const totalEntries = trips.reduce((s, t) => s + t.entries.length, 0);
  if (loading)
    return (
      <div className="loading-screen">
        <Compass size={38} />
        <span>Finding your next adventure…</span>
      </div>
    );
  return (
    <>
      {!user ? (
        <Landing onDemo={enterDemo} onAuth={(type) => setModal({ type })} />
      ) : (
        <div className="app-shell">
          {mobileNav && (
            <button
              className="nav-shade"
              aria-label="Close navigation"
              onClick={() => setMobileNav(false)}
            />
          )}
          <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
            <button className="brand" onClick={() => go("Overview")}>
              <span className="brand-icon">
                <Compass size={24} />
              </span>
              roam<span className="brand-period">.</span>
            </button>
            <div className="workspace-label">YOUR LITTLE WORLD</div>
            <nav>
              {navItems.map(([Icon, label]) => (
                <button
                  key={label}
                  className={`nav-item ${view === label ? "active" : ""}`}
                  onClick={() => go(label)}
                >
                  <Icon size={19} />
                  {label}
                  {label === "My trips" && (
                    <span className="nav-count">{trips.length}</span>
                  )}
                </button>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <div className="adventure-note">
                <span className="note-star">✳</span>
                <p>
                  Less scrolling.
                  <br />
                  More exploring.
                </p>
                <span>Your next chapter is out there.</span>
                <button onClick={() => setModal({ type: "trip" })}>
                  Plan a little escape <ArrowUpRight size={16} />
                </button>
              </div>
              <button className="export-button" onClick={exportTrips}>
                <Download size={17} />
                Export my journal
              </button>
              <div className="profile">
                <span className="avatar">{user.name[0].toUpperCase()}</span>
                <div>
                  <strong>{user.name}</strong>
                  <span>{demo ? "Demo explorer" : "Personal account"}</span>
                </div>
                <button
                  aria-label="Sign out"
                  title="Sign out"
                  onClick={signOut}
                >
                  <LogOut size={17} />
                </button>
              </div>
            </div>
          </aside>
          <div className="main-shell">
            <header className="topbar">
              <div>
                <button
                  className="mobile-menu icon-button"
                  aria-label="Open navigation"
                  onClick={() => setMobileNav(true)}
                >
                  <Menu size={21} />
                </button>
                <span>Your space to wander</span>
                <span className="topbar-slash">/</span>
                <strong>{current ? current.title : view}</strong>
              </div>
              <div className="topbar-right">
                <span className="live-dot" />
                {demo ? "Demo workspace" : "Your private workspace"}
                <span className="avatar small">
                  {user.name[0].toUpperCase()}
                </span>
              </div>
            </header>
            {demo && (
              <div className="demo-banner">
                <Sparkles size={15} />
                <span>
                  You’re exploring the demo. Changes stay in this browser.
                </span>
                <button onClick={() => setModal({ type: "register" })}>
                  Create an account <ArrowRight size={14} />
                </button>
              </div>
            )}
            <main>
              {current ? (
                <TripDetail
                  trip={current}
                  busy={busy}
                  onSave={async (trip) => {
                    try {
                      await saveTrip(trip);
                    } catch (e) {
                      setToast(e.message);
                    }
                  }}
                  onCalendar={() => exportCalendar(current)}
                  onBack={() => setSelected(null)}
                  onEdit={() => setModal({ type: "trip", trip: current })}
                  onDelete={() => setModal({ type: "delete", trip: current })}
                  onAdd={(type) => setModal({ type, trip: current })}
                  onRemove={async (key, id) => {
                    try {
                      await saveTrip({
                        ...current,
                        [key]: current[key].filter((v) => v.id !== id),
                      });
                    } catch (e) {
                      setToast(e.message);
                    }
                  }}
                />
              ) : (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">
                        A LITTLE PLANNING. A LOT OF POSSIBILITY.
                      </div>
                      <h1>
                        {view === "Overview"
                          ? "Make room for adventure."
                          : view === "My trips"
                            ? "Every trip, a new chapter."
                            : view === "Travel journal"
                              ? "Keep the feeling."
                              : "More moments. Less guesswork."}
                      </h1>
                      <p>
                        {view === "Overview"
                          ? "Big dreams, small escapes, and everything in between."
                          : view === "My trips"
                            ? "All the places you’re going. All the places you’ve been."
                            : view === "Travel journal"
                              ? "The little things you’ll want to remember forever."
                              : "A little clarity for the adventures ahead."}
                      </p>
                    </div>
                    <button
                      className="button primary"
                      onClick={() => setModal({ type: "trip" })}
                    >
                      <Plus size={18} />
                      New trip
                    </button>
                  </div>
                  {view === "Overview" && (
                    <>
                      <div className="stats-grid">
                        <Stat
                          icon={Map}
                          label="Adventures planned"
                          value={String(trips.length).padStart(2, "0")}
                          sub="A world of possibility"
                        />
                        <Stat
                          icon={Globe2}
                          label="Countries on your map"
                          value={String(
                            new Set(trips.map((t) => t.country.toLowerCase()))
                              .size,
                          ).padStart(2, "0")}
                          sub="And so many more to go"
                        />
                        <Stat
                          icon={BookOpen}
                          label="Memories collected"
                          value={String(totalEntries).padStart(2, "0")}
                          sub="Little moments, kept forever"
                        />
                      </div>
                      {upcoming ? (
                        <section
                          className="next-adventure"
                          style={{
                            backgroundImage: `linear-gradient(90deg,rgba(15,43,35,.88),rgba(15,43,35,.34),rgba(15,43,35,.02)),url(${photo(upcoming.cover, 1600)})`,
                          }}
                        >
                          <div className="hero-copy">
                            <span className="hero-kicker">
                              <span />
                              YOUR NEXT CHAPTER
                            </span>
                            <h2>
                              {upcoming.destination.split("&")[0].trim()} is
                              calling.
                            </h2>
                            <p>
                              {upcoming.notes ||
                                "A new place. A fresh perspective. Your next great story."}
                            </p>
                            <div className="hero-meta">
                              <span>
                                <CalendarDays size={16} />
                                {dateLabel(upcoming.startDate)} –{" "}
                                {dateLabel(upcoming.endDate)}
                              </span>
                              <span>
                                <MapPin size={16} />
                                {upcoming.country}
                              </span>
                            </div>
                            <button
                              className="button light"
                              onClick={() => setSelected(upcoming.id)}
                            >
                              Let’s get ready <ArrowUpRight size={17} />
                            </button>
                          </div>
                          <div className="hero-stamp">
                            <Compass size={28} />
                            <span>
                              TAKE THE
                              <br />
                              SCENIC ROUTE
                            </span>
                          </div>
                          <span className="image-credit">
                            YOUR NEXT ADVENTURE, IN FOCUS
                          </span>
                        </section>
                      ) : (
                        <section className="new-adventure">
                          <Compass size={38} />
                          <h2>Where will your story start?</h2>
                          <p>
                            You don’t need a perfect plan. Just a place you’d
                            love to go.
                          </p>
                          <button
                            className="button primary"
                            onClick={() => setModal({ type: "trip" })}
                          >
                            Plan your first trip <ArrowRight size={17} />
                          </button>
                        </section>
                      )}
                    </>
                  )}
                  {(view === "Overview" || view === "My trips") && (
                    <section className="trips-section">
                      <div className="section-heading">
                        <div>
                          <h2>
                            {view === "Overview" ? "Your journeys" : "My trips"}{" "}
                            <span className="count-pill">{trips.length}</span>
                          </h2>
                          <p>
                            A collection of places, plans, and possibilities.
                          </p>
                        </div>
                        {view === "Overview" && (
                          <button
                            className="text-button"
                            onClick={() => go("My trips")}
                          >
                            View all trips <ArrowRight size={16} />
                          </button>
                        )}
                      </div>
                      <div className="trip-controls">
                        <div
                          className="tabs"
                          role="group"
                          aria-label="Filter trips"
                        >
                          {[
                            "All trips",
                            "Upcoming",
                            "In progress",
                            "Completed",
                          ].map((f) => (
                            <button
                              key={f}
                              className={filter === f ? "selected" : ""}
                              onClick={() => setFilter(f)}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                        <label className="search-box">
                          <Search size={17} />
                          <input
                            placeholder="Find a little adventure…"
                            aria-label="Search trips"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                          />
                        </label>
                      </div>
                      <div className="trip-grid">
                        {filtered.map((t) => (
                          <TripCard
                            key={t.id}
                            trip={t}
                            onOpen={() => setSelected(t.id)}
                          />
                        ))}
                        {!search && filter === "All trips" && (
                          <button
                            className="add-trip-card"
                            onClick={() => setModal({ type: "trip" })}
                          >
                            <span>
                              <Plus size={25} />
                            </span>
                            <strong>The next one is yours.</strong>
                            <p>
                              A weekend away or a world away.
                              <br />
                              Start with a little idea.
                            </p>
                            <b>
                              Plan a trip <ArrowUpRight size={15} />
                            </b>
                          </button>
                        )}
                      </div>
                      {filtered.length === 0 &&
                        (search || filter !== "All trips") && (
                          <Empty
                            icon={Search}
                            title="No journeys here just yet."
                            text="Try another search or a different filter."
                          />
                        )}
                    </section>
                  )}
                  {view === "Travel journal" && (
                    <Journal
                      trips={trips}
                      onOpen={setSelected}
                      onNew={() =>
                        trips.length
                          ? setModal({ type: "entry", trip: trips[0] })
                          : setModal({ type: "trip" })
                      }
                    />
                  )}
                  {view === "Budgets" && (
                    <Budgets trips={trips} onOpen={setSelected} />
                  )}
                  <footer className="page-footer">
                    <span>Made for the way you wander.</span>
                    <span>
                      <Compass size={14} /> The best stories start with a little
                      curiosity.
                    </span>
                  </footer>
                </>
              )}
            </main>
          </div>
        </div>
      )}
      {modal && (
        <Modal
          onClose={() => !busy && setModal(null)}
          wide={modal.type === "trip"}
        >
          {modal.type === "login" || modal.type === "register" ? (
            <AuthForm
              type={modal.type}
              onSwitch={() =>
                setModal({
                  type: modal.type === "login" ? "register" : "login",
                })
              }
              onSuccess={onAuth}
              onDemo={enterDemo}
            />
          ) : modal.type === "trip" ? (
            <TripForm
              trip={modal.trip}
              busy={busy}
              onSave={saveTrip}
              onCancel={() => setModal(null)}
            />
          ) : modal.type === "delete" ? (
            <div>
              <div className="modal-symbol danger">
                <Trash2 />
              </div>
              <h2>Delete this trip?</h2>
              <p className="muted">
                “{modal.trip.title}” and its itinerary, expenses, and journal
                entries will be permanently deleted.
              </p>
              <div className="form-actions">
                <button
                  className="button secondary"
                  onClick={() => setModal(null)}
                >
                  Keep trip
                </button>
                <button
                  className="button danger-button"
                  disabled={busy}
                  onClick={() => deleteTrip(modal.trip)}
                >
                  {busy ? "Deleting…" : "Delete trip"}
                </button>
              </div>
            </div>
          ) : (
            <ItemForm
              type={modal.type}
              trip={modal.trip}
              busy={busy}
              onSave={saveTrip}
            />
          )}
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
          <button aria-label="Dismiss message" onClick={() => setToast("")}>
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
