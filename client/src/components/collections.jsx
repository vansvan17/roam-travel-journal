import React from "react";
import { ArrowUpRight, BookOpen, Heart, Plus, Wallet } from "lucide-react";
import { photo, dateLabel, spent, money } from "../data.js";
import { Empty } from "./ui.jsx";

export function Journal({ trips, onOpen, onNew }) {
  const entries = trips
    .flatMap((t) => t.entries.map((e) => ({ ...e, trip: t })))
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <section>
      <div className="section-heading">
        <div>
          <h2>
            Your collected moments{" "}
            <span className="count-pill">{entries.length}</span>
          </h2>
          <p>Every story deserves a place to stay.</p>
        </div>
        <button className="button secondary" onClick={onNew}>
          <Plus size={16} />
          Write a memory
        </button>
      </div>
      {entries.length ? (
        <div className="journal-grid">
          {entries.map((e) => (
            <button
              key={e.id}
              className="journal-card"
              onClick={() => onOpen(e.trip.id)}
            >
              <div
                className="journal-photo"
                style={{ backgroundImage: `url(${photo(e.trip.cover, 800)})` }}
              >
                <span className="mood">
                  <Heart size={12} />
                  {e.mood}
                </span>
              </div>
              <div>
                <span className="eyebrow">
                  {dateLabel(e.date, { year: "numeric" })} · {e.trip.country}
                </span>
                <h2>{e.title}</h2>
                <p>{e.body}</p>
                <span className="text-button">
                  {e.trip.title}
                  <ArrowUpRight size={16} />
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <Empty
          icon={BookOpen}
          title="Make a little memory."
          text="Open a trip and write your first journal entry."
        />
      )}
    </section>
  );
}

export function Budgets({ trips, onOpen }) {
  return (
    <section>
      <div className="budget-info">
        <Wallet size={22} />
        <p>
          Every trip has its own adventure fund. Amounts are shown in each
          trip’s currency so you always know where you stand.
        </p>
      </div>
      <div className="budget-grid">
        {trips.map((t) => {
          const total = spent(t);
          return (
            <button
              key={t.id}
              className="budget-card"
              onClick={() => onOpen(t.id)}
            >
              <div className="budget-card-top">
                <img src={photo(t.cover, 200)} alt="" />
                <div>
                  <h3>{t.title}</h3>
                  <span>{t.destination}</span>
                </div>
                <ArrowUpRight size={18} />
              </div>
              <div className="budget-numbers">
                <div>
                  <span>SPENT</span>
                  <strong>{money(total, t.currency)}</strong>
                </div>
                <div>
                  <span>PLANNED BUDGET</span>
                  <strong>{money(t.budget, t.currency)}</strong>
                </div>
              </div>
              <div className={`progress ${total > t.budget ? "over" : ""}`}>
                <span
                  style={{
                    width: `${t.budget ? Math.min(100, (total / t.budget) * 100) : total ? 100 : 0}%`,
                  }}
                />
              </div>
              <p>
                {money(Math.abs(t.budget - total), t.currency)}{" "}
                {total > t.budget ? "over budget" : "left to explore"}
                <span>{t.expenses.length} expenses</span>
              </p>
            </button>
          );
        })}
      </div>
      {!trips.length && (
        <Empty
          icon={Wallet}
          title="Your adventure fund starts with a trip."
          text="Create a journey, set a budget, and track your expenses as you go."
        />
      )}
    </section>
  );
}
