import React, { useState } from "react";
import {
  BookOpen,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  Compass,
  Heart,
  Map,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Wallet,
} from "lucide-react";
import { photo, dateLabel, duration, money, spent } from "../data.js";
import {
  planReadiness,
  dateForDay,
  stopDuration,
} from "../../../shared/planning.js";
import { Empty, RemoveButton } from "./ui.jsx";

export function TripDetail({
  trip: t,
  busy,
  onSave,
  onCalendar,
  onBack,
  onEdit,
  onDelete,
  onAdd,
  onRemove,
}) {
  const [tab, setTab] = useState("Itinerary"),
    [removing, setRemoving] = useState(null);
  const total = spent(t),
    percent = t.budget
      ? Math.min(100, (total / t.budget) * 100)
      : total
        ? 100
        : 0;
  const days = [...new Set(t.itinerary.map((i) => i.day))].sort(
    (a, b) => a - b,
  );
  return (
    <>
      <button className="back-link" onClick={onBack}>
        <ChevronLeft size={17} />
        Back to your journeys
      </button>
      <section
        className="detail-hero"
        style={{
          backgroundImage: `linear-gradient(0deg,rgba(10,31,25,.78),transparent),url(${photo(t.cover, 1600)})`,
        }}
      >
        <div>
          <span
            className={`status ${t.status.replace(" ", "-").toLowerCase()}`}
          >
            <span />
            {t.status}
          </span>
          <h1>{t.title}</h1>
          <p>
            <MapPin size={17} />
            {t.destination}, {t.country}
            <span>·</span>
            <CalendarDays size={17} />
            {dateLabel(t.startDate)} –{" "}
            {dateLabel(t.endDate, { year: "numeric" })}
          </p>
        </div>
        <button className="button light" onClick={onEdit}>
          <Pencil size={16} />
          Edit trip
        </button>
      </section>
      <div className="detail-summary">
        <div>
          <span>TIME TO EXPLORE</span>
          <strong>{duration(t)} days</strong>
        </div>
        <div>
          <span>TRIP BUDGET</span>
          <strong>{money(t.budget, t.currency)}</strong>
        </div>
        <div>
          <span>SPENT SO FAR</span>
          <strong>{money(total, t.currency)}</strong>
        </div>
        <div>
          <span>MEMORIES SAVED</span>
          <strong>{String(t.entries.length).padStart(2, "0")}</strong>
        </div>
      </div>
      {t.notes && (
        <div className="trip-note">
          <Sparkles size={18} />
          <p>{t.notes}</p>
        </div>
      )}
      <div className="detail-columns">
        <section className="detail-content">
          <div
            className="detail-tabs"
            role="tablist"
            aria-label="Trip sections"
          >
            {["Itinerary", "Expenses", "Journal"].map((v) => (
              <button
                role="tab"
                aria-selected={tab === v}
                key={v}
                className={tab === v ? "selected" : ""}
                onClick={() => {
                  setTab(v);
                  setRemoving(null);
                }}
              >
                {v}
                <span>
                  {
                    t[
                      v === "Itinerary"
                        ? "itinerary"
                        : v === "Expenses"
                          ? "expenses"
                          : "entries"
                    ].length
                  }
                </span>
              </button>
            ))}
          </div>
          <div className="detail-section-heading">
            <div>
              <h2>
                {tab === "Itinerary"
                  ? "A little plan. Room to wander."
                  : tab === "Expenses"
                    ? "Every little expense."
                    : "The moments in between."}
              </h2>
              <p>
                {tab === "Itinerary"
                  ? "Make a plan, then follow your curiosity."
                  : tab === "Expenses"
                    ? `All amounts in ${t.currency}. No currency conversion.`
                    : "A place to keep the feeling."}
              </p>
            </div>
            <button
              className="button secondary compact"
              onClick={() =>
                onAdd(
                  tab === "Itinerary"
                    ? "stop"
                    : tab === "Expenses"
                      ? "expense"
                      : "entry",
                )
              }
            >
              <Plus size={16} />
              {tab === "Itinerary"
                ? "Add stop"
                : tab === "Expenses"
                  ? "Add expense"
                  : "Write a memory"}
            </button>
          </div>
          {tab === "Itinerary" &&
            (days.length ? (
              days.map((day) => (
                <div className="day-group" key={day}>
                  <div className="day-label">
                    <span>
                      DAY {String(day).padStart(2, "0")} ·{" "}
                      {dateLabel(dateForDay(t, day))}
                    </span>
                    <i />
                  </div>
                  {t.itinerary
                    .filter((i) => i.day === day)
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((i) => (
                      <div className="itinerary-item" key={i.id}>
                        <span className="stop-time">{i.time}</span>
                        <span className="timeline-dot" />
                        <div>
                          <h3>
                            {i.title}{" "}
                            <small className="stop-duration">
                              {stopDuration(i)} min
                            </small>
                          </h3>
                          {i.notes && <p>{i.notes}</p>}
                        </div>
                        <RemoveButton
                          id={i.id}
                          removing={removing}
                          setRemoving={setRemoving}
                          busy={busy}
                          onRemove={() => onRemove("itinerary", i.id)}
                        />
                      </div>
                    ))}
                </div>
              ))
            ) : (
              <Empty
                icon={Map}
                title="Leave a little room for adventure."
                text="Add your first stop and start shaping your trip."
              />
            ))}
          {tab === "Expenses" &&
            (t.expenses.length ? (
              <div className="expense-list">
                {[...t.expenses]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((e) => (
                    <div className="expense-row" key={e.id}>
                      <span
                        className={`expense-icon cat-${e.category.toLowerCase()}`}
                      >
                        <Wallet size={18} />
                      </span>
                      <div>
                        <h3>{e.title}</h3>
                        <p>
                          {e.category} <span>·</span> {dateLabel(e.date)}
                        </p>
                      </div>
                      <strong>{money(e.amount, t.currency)}</strong>
                      <RemoveButton
                        id={e.id}
                        removing={removing}
                        setRemoving={setRemoving}
                        busy={busy}
                        onRemove={() => onRemove("expenses", e.id)}
                      />
                    </div>
                  ))}
              </div>
            ) : (
              <Empty
                icon={Wallet}
                title="A fresh start for your budget."
                text="Add bookings, meals, rides, and little treats along the way."
              />
            ))}
          {tab === "Journal" &&
            (t.entries.length ? (
              <div className="entry-list">
                {[...t.entries]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((e) => (
                    <article className="journal-entry" key={e.id}>
                      <div className="entry-top">
                        <span>{dateLabel(e.date, { year: "numeric" })}</span>
                        <span className="mood">
                          <Heart size={12} />
                          {e.mood}
                        </span>
                        <RemoveButton
                          id={e.id}
                          removing={removing}
                          setRemoving={setRemoving}
                          busy={busy}
                          onRemove={() => onRemove("entries", e.id)}
                        />
                      </div>
                      <h3>{e.title}</h3>
                      <p>{e.body}</p>
                    </article>
                  ))}
              </div>
            ) : (
              <Empty
                icon={BookOpen}
                title="A story waiting to be written."
                text="The best memories are often the smallest moments."
              />
            ))}
        </section>
        <aside className="trip-aside">
          <PlanPanel
            trip={t}
            busy={busy}
            onSave={onSave}
            onCalendar={onCalendar}
          />
          <div className="budget-widget">
            <div className="widget-top">
              <span className="stat-icon">
                <Wallet size={20} />
              </span>
              <span>THE ADVENTURE FUND</span>
            </div>
            <h3>{money(Math.abs(t.budget - total), t.currency)}</h3>
            <p>
              {total > t.budget
                ? "over your planned budget"
                : "left for the good stuff"}
            </p>
            <div className={`progress ${total > t.budget ? "over" : ""}`}>
              <span style={{ width: `${percent}%` }} />
            </div>
            <div className="budget-legend">
              <span>Spent {money(total, t.currency)}</span>
              <span>{money(t.budget, t.currency)}</span>
            </div>
            <button className="text-button" onClick={() => onAdd("expense")}>
              Add an expense <Plus size={15} />
            </button>
          </div>
          <div className="travel-tip">
            <Compass size={26} />
            <h3>
              Collect moments.
              <br />
              Keep the feeling.
            </h3>
            <p>
              The unexpected café. The wrong turn that felt right. Write it down
              while it’s still fresh.
            </p>
            <button className="text-button" onClick={() => onAdd("entry")}>
              Write a memory <ArrowRight size={15} />
            </button>
          </div>
          <button className="delete-trip" onClick={onDelete}>
            <Trash2 size={14} />
            Delete this trip
          </button>
        </aside>
      </div>
    </>
  );
}

export function PlanPanel({ trip, busy, onSave, onCalendar }) {
  const readiness = planReadiness(trip),
    isReady = trip.planStatus === "Ready";
  return (
    <section className="plan-panel" aria-label="Trip readiness">
      <div className="widget-top">
        <Compass size={20} />
        <span>YOUR PLAN · {isReady ? "READY" : "DRAFT"}</span>
      </div>
      <h3>
        {readiness.plannedDays} of {readiness.totalDays} days planned
      </h3>
      <ul>
        {readiness.checks.map((check) => (
          <li key={check.label} className={check.passed ? "passed" : ""}>
            {check.passed ? (
              <Check size={14} />
            ) : (
              <span className="check-circle" />
            )}
            {check.label}
          </li>
        ))}
      </ul>
      {readiness.missingDays.length > 0 && (
        <p className="planning-hint">
          Add a stop for day{readiness.missingDays.length > 1 ? "s" : ""}{" "}
          {readiness.missingDays.slice(0, 8).join(", ")}
          {readiness.missingDays.length > 8 ? "…" : ""}.
        </p>
      )}
      <button
        className="button primary full"
        disabled={busy || (!isReady && !readiness.ready)}
        onClick={() =>
          onSave({ ...trip, planStatus: isReady ? "Draft" : "Ready" })
        }
      >
        {isReady ? "Move back to draft" : "Mark plan ready"}
      </button>
      <button
        className="text-button calendar-export"
        disabled={!trip.itinerary.length}
        onClick={onCalendar}
      >
        <CalendarDays size={15} />
        Export itinerary calendar
      </button>
      <p className="calendar-hint">
        Times use your calendar’s local time zone.
      </p>
    </section>
  );
}
